const asyncHandler = require('../utils/asyncHandler');
const Challenge = require('../models/Challenge');
const QRBlock = require('../models/QRBlock');
const TestCase = require('../models/TestCase');
const ParticipantSession = require('../models/ParticipantSession');
const { getProgressForUser, checkChallengeLock } = require('../services/challenge/progressionService');

const findChallengeByIdOrSlug = async (idOrSlug) => {
  if (!idOrSlug) return null;
  if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
    const c = await Challenge.findById(idOrSlug);
    if (c) return c;
  }
  return await Challenge.findOne({
    $or: [{ slug: idOrSlug }, { slug: String(idOrSlug).toLowerCase() }],
  });
};

async function resolveChallengeTestCases(challenge) {
  if (!challenge) return { visibleTests: [], sampleInput: '', sampleOutput: '' };

  const testCases = await TestCase.find({
    $or: [{ challengeId: challenge._id }, { challengeId: challenge.slug }],
    isEnabled: true,
  }).sort({ orderIndex: 1 });

  if (!testCases || testCases.length === 0) {
    return {
      visibleTests: [],
      sampleInput: challenge.sampleInput || '',
      sampleOutput: challenge.sampleOutput || '',
    };
  }

  // Find explicitly visible test cases
  const explicitlyVisible = testCases.filter((tc) => !tc.isHidden);

  // Check if current challenge.sampleInput matches any test case in DB
  const rawInput = (challenge.sampleInput || '').trim();
  const matchedSample = testCases.find((tc) => (tc.input || '').trim() === rawInput);

  // Determine authoritative sample test case:
  // 1. If challenge.sampleInput matched a test case in DB, that's valid
  // 2. Otherwise first explicitly visible test case
  // 3. Otherwise test case whose description includes 'sample'
  // 4. Otherwise first test case in DB
  const sampleTc =
    (matchedSample ? matchedSample : null) ||
    explicitlyVisible[0] ||
    testCases.find((tc) => (tc.description || '').toLowerCase().includes('sample')) ||
    testCases[0];

  const resolvedSampleInput = sampleTc ? (sampleTc.input || '').replace(/\r\n/g, '\n').trim() : (challenge.sampleInput || '');
  const resolvedSampleOutput = sampleTc ? (sampleTc.expectedOutput || '').replace(/\r\n/g, '\n').trim() : (challenge.sampleOutput || '');

  // Visible tests to expose to user:
  let visibleTests = explicitlyVisible.map((tc) => ({
    input: tc.input || '',
    expectedOutput: tc.expectedOutput || '',
    weight: tc.weight || 20,
    description: tc.description || '',
  }));

  // If no test cases are explicitly visible, provide at least the sample test case
  if (visibleTests.length === 0 && sampleTc) {
    visibleTests = [
      {
        input: sampleTc.input || '',
        expectedOutput: sampleTc.expectedOutput || '',
        weight: sampleTc.weight || 20,
        description: sampleTc.description || 'Sample Test Case',
      },
    ];
  }

  // If the challenge doc in DB has stale or empty sampleInput/sampleOutput, sync asynchronously
  if (
    challenge._id &&
    (!matchedSample || !challenge.sampleInput || !challenge.sampleOutput) &&
    resolvedSampleInput &&
    (challenge.sampleInput !== resolvedSampleInput || challenge.sampleOutput !== resolvedSampleOutput)
  ) {
    Challenge.findByIdAndUpdate(challenge._id, {
      sampleInput: resolvedSampleInput,
      sampleOutput: resolvedSampleOutput,
    }).catch((err) => console.warn('[resolveChallengeTestCases] DB sync warning:', err.message));
  }

  return {
    visibleTests,
    sampleInput: resolvedSampleInput,
    sampleOutput: resolvedSampleOutput,
  };
}

function sanitizePublicChallenge(challengeDoc, visibleTests = null, sampleInput = null, sampleOutput = null) {
  const raw = challengeDoc.toObject ? challengeDoc.toObject() : { ...challengeDoc };
  delete raw.sourceCode;

  if (sampleInput !== null && sampleInput !== undefined) {
    raw.sampleInput = sampleInput;
  }
  if (sampleOutput !== null && sampleOutput !== undefined) {
    raw.sampleOutput = sampleOutput;
  }

  if (Array.isArray(raw.tasks)) {
    raw.tasks = raw.tasks.map((t) => ({
      taskId: t.taskId,
      title: t.title,
      description: t.description || '',
      order: t.order,
      penalty: t.penalty,
      cooldownSeconds: t.cooldownSeconds,
      totalQuizzes: Array.isArray(t.quizPool) ? t.quizPool.length : 0,
      quizPool: Array.isArray(t.quizPool)
        ? t.quizPool.map((q) => ({
            quizId: q.quizId,
            type: q.type,
            prompt: q.prompt,
            options: q.options || [],
            concept: q.concept || '',
          }))
        : [],
    }));
  }

  if (Array.isArray(raw.languageConfigs)) {
    raw.languageConfigs = raw.languageConfigs.map((lc) => ({
      language: lc.language,
      languageName: lc.languageName || lc.language,
      blockCount: Array.isArray(lc.blocks) ? lc.blocks.length : 0,
      revealOrder: lc.revealOrder || [],
    }));
  }

  if (visibleTests) {
    raw.visibleTestCases = visibleTests;
  }

  return raw;
}

exports.getChallenges = asyncHandler(async (req, res) => {
  let challenges = await Challenge.find({
    isActive: true,
    status: 'Published',
    sequenceOrder: { $in: [1, 2, 3] },
  })
    .sort({ sequenceOrder: 1 })
    .select('-sourceCode');

  if (challenges.length === 0) {
    challenges = await Challenge.find({
      isActive: true,
      status: 'Published',
      slug: { $in: ['ch-05', 'ch-06', 'ch-07'] },
    }).select('-sourceCode');

    const order = { 'ch-05': 1, 'ch-06': 2, 'ch-07': 3, easy: 1, medium: 2, hard: 3 };
    challenges.sort((a, b) => {
      const aVal = order[a.slug] || order[a.difficulty?.toLowerCase()] || 99;
      const bVal = order[b.slug] || order[b.difficulty?.toLowerCase()] || 99;
      return aVal - bVal;
    });
  }

  if (challenges.length === 0) {
    challenges = await Challenge.find({ isActive: true, status: 'Published' })
      .limit(3)
      .select('-sourceCode');
  }

  const sanitized = await Promise.all(
    challenges.map(async (c, idx) => {
      const { visibleTests, sampleInput, sampleOutput } = await resolveChallengeTestCases(c);
      const s = sanitizePublicChallenge(c, visibleTests, sampleInput, sampleOutput);
      if (!s.sequenceOrder) s.sequenceOrder = idx + 1;
      return s;
    })
  );
  res.json({ success: true, challenges: sanitized });
});


exports.getUserProgress = asyncHandler(async (req, res) => {
  const result = await getProgressForUser(req.user?._id, req.user);
  res.json({
    success: true,
    progress: result.progress,
    currentChallengeSlug: result.currentChallengeSlug,
    allCompleted: result.allCompleted,
    enforceProgression: result.enforceProgression,
  });
});

exports.getChallengeById = asyncHandler(async (req, res) => {
  // Never expose sourceCode to participants
  const challengeId = req.params.id;
  let challenge = null;
  if (/^[0-9a-fA-F]{24}$/.test(challengeId)) {
    challenge = await Challenge.findById(challengeId).select('-sourceCode');
  }
  if (!challenge) {
    challenge = await Challenge.findOne({
      $or: [{ slug: challengeId }, { slug: String(challengeId).toLowerCase() }],
    }).select('-sourceCode');
  }
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  const { visibleTests, sampleInput, sampleOutput } = await resolveChallengeTestCases(challenge);

  res.json({
    success: true,
    challenge: sanitizePublicChallenge(challenge, visibleTests, sampleInput, sampleOutput),
  });
});

exports.getActiveChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findOne({ isActive: true }).select('-sourceCode');
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'No active challenge found' });
  }
  const { visibleTests, sampleInput, sampleOutput } = await resolveChallengeTestCases(challenge);
  res.json({
    success: true,
    challenge: sanitizePublicChallenge(challenge, visibleTests, sampleInput, sampleOutput),
  });
});

/**
 * Get blocks for participant arena
 * SECURITY: Strips 'originalOrder' and only provides initially visible + revealed blocks
 */
exports.getParticipantBlocks = asyncHandler(async (req, res) => {
  const challengeId = req.params.id;
  const challenge = await findChallengeByIdOrSlug(challengeId);
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  if (req.user && !(await checkChallengeLock(req, res, challenge))) {
    return;
  }

  const allBlocks = await QRBlock.find({ challengeId }).sort({ displayOrder: 1 });

  // If user is authenticated, check their session
  let revealedIds = [];
  if (req.user) {
    const session = await ParticipantSession.findOne({ userId: req.user._id, challengeId });
    if (session) {
      revealedIds = session.revealedBlockIds || [];
    }
  }

  const initialCount = challenge.blockConfig?.initialVisibleCount || 3;

  // Filter blocks that are initially visible OR already unlocked/revealed
  const participantBlocks = allBlocks.map((block) => {
    const isInitiallyVisible = block.displayOrder <= initialCount || block.isInitiallyVisible;
    const isUnlocked = isInitiallyVisible || revealedIds.includes(block.blockId);

    const cleanSnippet = block.codeSnippet
      ? block.codeSnippet.replace(/#\s*DECOY[^\n]*/gi, '').replace(/\/\/\s*DECOY[^\n]*/gi, '')
      : null;

    return {
      blockId: block.blockId,
      code: isUnlocked ? cleanSnippet : null, // Hide code if locked
      codeSnippet: isUnlocked ? cleanSnippet : null,
      blockType: isUnlocked ? (block.type || block.blockType || 'LOGIC') : 'LOCKED',
      type: isUnlocked ? (block.type || block.blockType || 'LOGIC') : 'LOCKED',
      language: block.language,
      qrToken: block.qrToken || block.qrHash,
      qrHash: block.qrHash || block.qrToken,
      displayOrder: block.displayOrder,
      taskId: block.taskId,
      isUnlocked,
      hint: isUnlocked ? block.hint : 'Hidden Code Fragment',
      // DO NOT INCLUDE originalOrder, correctOrder, or isDecoy
    };
  });

  res.json({
    success: true,
    blocks: participantBlocks,
    totalBlocks: allBlocks.length,
    unlockedCount: participantBlocks.filter((b) => b.isUnlocked).length,
    tasks: challenge.tasks || [],
  });
});

/**
 * Reveal next block for participant (supports task-based reveal)
 */
exports.revealBlock = asyncHandler(async (req, res) => {
  const challengeId = req.params.id;
  const { taskId, blockId: requestedBlockId } = req.body || {};

  const challenge = await findChallengeByIdOrSlug(challengeId);
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  if (req.user && !(await checkChallengeLock(req, res, challenge))) {
    return;
  }

  const allBlocks = await QRBlock.find({ challengeId }).sort({ displayOrder: 1 });
  const initialCount = challenge.blockConfig?.initialVisibleCount || 3;
  const maxReveals = challenge.blockConfig?.maxReveals || allBlocks.length;
  const revealPenalty = challenge.blockConfig?.revealPenalty !== undefined ? challenge.blockConfig.revealPenalty : 5;

  let session = null;
  if (req.user) {
    session = await ParticipantSession.findOne({ userId: req.user._id, challengeId });
    if (!session) {
      session = await ParticipantSession.create({
        userId: req.user._id,
        challengeId,
        revealedBlockIds: [],
        revealsCount: 0,
        revealEvents: [],
      });
    }
  }

  const currentReveals = session?.revealsCount || 0;
  if (currentReveals >= maxReveals) {
    return res.status(400).json({ success: false, message: 'Maximum reveals limit reached for this challenge' });
  }

  const alreadyRevealed = new Set(session?.revealedBlockIds || []);

  let targetBlock = null;

  // 1. Task-based reveal matching
  if (taskId) {
    const task = (challenge.tasks || []).find((t) => t.taskId === taskId);
    if (task && Array.isArray(task.requiredBlockIds) && task.requiredBlockIds.length > 0) {
      targetBlock = allBlocks.find((b) => task.requiredBlockIds.includes(b.blockId) && !alreadyRevealed.has(b.blockId));
    }
    if (!targetBlock) {
      targetBlock = allBlocks.find((b) => b.taskId === taskId && !alreadyRevealed.has(b.blockId));
    }
  }

  // 2. Specific blockId requested
  if (!targetBlock && requestedBlockId) {
    targetBlock = allBlocks.find((b) => b.blockId === requestedBlockId && !alreadyRevealed.has(b.blockId));
  }

  // 3. Fallback: Next locked block in displayOrder
  if (!targetBlock) {
    targetBlock = allBlocks.find((b) => b.displayOrder > initialCount && !alreadyRevealed.has(b.blockId));
  }

  if (!targetBlock) {
    return res.status(400).json({ success: false, message: 'All relevant blocks are already revealed' });
  }

  if (session) {
    session.revealedBlockIds.push(targetBlock.blockId);
    session.revealsCount += 1;
    session.penaltyCount = (session.penaltyCount || 0) + revealPenalty;
    if (!Array.isArray(session.revealEvents)) {
      session.revealEvents = [];
    }
    session.revealEvents.push({
      taskId: taskId || targetBlock.taskId || 'general',
      blockId: targetBlock.blockId,
      penalty: revealPenalty,
      timestamp: new Date(),
    });
    session.lastActivityAt = new Date();
    await session.save();
  }

  res.json({
    success: true,
    revealedBlock: {
      blockId: targetBlock.blockId,
      code: targetBlock.codeSnippet,
      codeSnippet: targetBlock.codeSnippet,
      blockType: targetBlock.blockType,
      language: targetBlock.language,
      qrHash: targetBlock.qrHash,
      displayOrder: targetBlock.displayOrder,
      taskId: targetBlock.taskId,
      isUnlocked: true,
      hint: targetBlock.hint,
    },
    revealsCount: (session?.revealsCount || 0),
    maxReveals,
    penalty: revealPenalty,
    taskId: taskId || targetBlock.taskId,
  });
});
