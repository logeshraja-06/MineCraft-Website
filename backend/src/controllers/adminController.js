const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const QRBlock = require('../models/QRBlock');
const TestCase = require('../models/TestCase');
const Submission = require('../models/Submission');
const ParticipantSession = require('../models/ParticipantSession');
const Settings = require('../models/Settings');
const { generateCodeBlocks } = require('../services/challenge/codeBlockSplitter');
const { getLeaderboardData, freezeLeaderboard } = require('../services/leaderboard/leaderboardService');
const { generateExcelReport } = require('../services/reports/excelExportService');
const { generatePdfReport } = require('../services/reports/pdfExportService');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const { generateQRToken } = require('../services/qr/qrValidation');


const findAdminChallenge = async (idOrSlug) => {
  if (!idOrSlug) return null;
  if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
    const c = await Challenge.findById(idOrSlug);
    if (c) return c;
  }
  return await Challenge.findOne({
    $or: [{ slug: idOrSlug }, { slug: String(idOrSlug).toLowerCase() }],
  });
};

/**
 * OVERVIEW / DASHBOARD STATS
 */
exports.getOverview = asyncHandler(async (req, res) => {
  const [
    totalParticipants,
    activeContestantIds,
    totalChallenges,
    publishedChallenges,
    totalSubmissions,
    acceptedSubmissions,
    wrongAnswers,
    activeSessionsCount,
    recentSubmissions,
    activeSessions,
  ] = await Promise.all([
    User.countDocuments({ role: 'participant' }),
    ParticipantSession.distinct('userId', { isCompleted: false }),
    Challenge.countDocuments(),
    Challenge.countDocuments({ status: 'Published' }),
    Submission.countDocuments(),
    Submission.countDocuments({ status: 'ACCEPTED' }),
    Submission.countDocuments({ status: 'WRONG_ANSWER' }),
    ParticipantSession.countDocuments({ isCompleted: false }),
    Submission.find()
      .populate('userId', 'name email')
      .populate('challengeId', 'title')
      .sort({ createdAt: -1 })
      .limit(8),
    ParticipantSession.find({ isCompleted: false })
      .populate('userId', 'name email')
      .populate('challengeId', 'title points duration timeLimitSeconds')
      .sort({ lastActivityAt: -1 })
      .limit(10),
  ]);

  const liveSessions = activeSessions.map((s) => {
    const elapsed = Math.round((Date.now() - new Date(s.startTime).getTime()) / 1000);
    const totalSec = s.durationSeconds || 1200;
    const remainingSec = Math.max(0, totalSec - elapsed);
    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;

    return {
      id: s._id,
      participantName: s.userId?.name || 'Contestant',
      participantEmail: s.userId?.email || 'N/A',
      challengeTitle: s.challengeId?.title || 'Unknown Challenge',
      currentScore: s.scoreAwarded || 0,
      timeRemaining: `${mins}:${String(secs).padStart(2, '0')}`,
      status: s.status || 'ACTIVE',
      revealsCount: s.revealsCount || 0,
      blocksCount: (s.revealedBlockIds || []).length,
      lastActivityAt: s.lastActivityAt || s.updatedAt,
    };
  });

  res.json({
    success: true,
    stats: {
      totalParticipants,
      activeParticipants: activeContestantIds.length,
      totalChallenges,
      publishedChallenges,
      totalSubmissions,
      acceptedSubmissions,
      wrongAnswers,
      activeSessions: activeSessionsCount,
    },
    liveSessions,
    recentSubmissions: recentSubmissions.map((sub) => ({
      id: sub._id,
      participant: sub.userId?.name || 'Anonymous',
      challenge: sub.challengeId?.title || 'Unknown',
      language: (sub.language || 'code').toUpperCase(),
      status: sub.status,
      score: sub.score || 0,
      executionTime: sub.executionTimeMs ? `${sub.executionTimeMs}ms` : '0ms',
      submittedAt: sub.createdAt,
    })),
  });
});

/**
 * CHALLENGE MANAGEMENT
 */
exports.getChallenges = asyncHandler(async (req, res) => {
  const { search, difficulty, status, category, language } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
    ];
  }
  if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
  if (status && status !== 'All') filter.status = status;
  if (category && category !== 'All') filter.category = category;
  if (language && language !== 'All') filter.sourceLanguage = language;

  const challenges = await Challenge.find(filter).sort({ createdAt: -1 });

  // Enrich with block count and test case count
  const challengeIds = challenges.map((c) => c._id);
  const [blockCounts, testCaseCounts] = await Promise.all([
    QRBlock.aggregate([
      { $match: { challengeId: { $in: challengeIds } } },
      { $group: { _id: '$challengeId', count: { $sum: 1 } } },
    ]),
    TestCase.aggregate([
      { $match: { challengeId: { $in: challengeIds } } },
      { $group: { _id: '$challengeId', count: { $sum: 1 } } },
    ]),
  ]);

  const blockMap = Object.fromEntries(blockCounts.map((b) => [b._id.toString(), b.count]));
  const testMap = Object.fromEntries(testCaseCounts.map((t) => [t._id.toString(), t.count]));

  const enriched = challenges.map((c) => ({
    ...c.toObject(),
    blockCount: blockMap[c._id.toString()] || 0,
    testCaseCount: testMap[c._id.toString()] || 0,
  }));

  res.json({ success: true, challenges: enriched });
});

function formatChallengeForAdmin(challengeDoc, blocks = null, testCases = null) {
  if (!challengeDoc) return null;
  const obj = challengeDoc.toObject ? challengeDoc.toObject() : { ...challengeDoc };

  if (Array.isArray(obj.tasks)) {
    obj.tasks = obj.tasks.map((task) => {
      let rewardsObj = {};
      if (task.rewards) {
        if (task.rewards instanceof Map) {
          rewardsObj = Object.fromEntries(task.rewards);
        } else if (typeof task.rewards.entries === 'function') {
          rewardsObj = Object.fromEntries(task.rewards.entries());
        } else if (typeof task.rewards === 'object') {
          rewardsObj = { ...task.rewards };
        }
      }
      return {
        ...task,
        rewards: rewardsObj,
      };
    });
  }

  if (blocks) obj.blocks = blocks;
  if (testCases) obj.testCases = testCases;

  return obj;
}

exports.getChallengeById = asyncHandler(async (req, res) => {
  const challenge = await findAdminChallenge(req.params.id);
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  const [blocks, testCases] = await Promise.all([
    QRBlock.find({ challengeId: challenge._id }).sort({ originalOrder: 1 }),
    TestCase.find({ challengeId: challenge._id }).sort({ orderIndex: 1 }),
  ]);

  res.json({
    success: true,
    challenge: formatChallengeForAdmin(challenge, blocks, testCases),
  });
});

const ALLOWED_CHALLENGE_FIELDS = [
  'title', 'slug', 'description', 'category', 'difficulty', 'points',
  'timeLimitSeconds', 'duration', 'sampleInput', 'sampleOutput',
  'supportedLanguages', 'sourceLanguage', 'sourceCode', 'splitStrategy',
  'blockConfig', 'tasks', 'status', 'isActive', 'tags', 'sequenceOrder',
  'languageConfigs', 'instructions', 'inputFormat', 'outputFormat', 'constraints', 'maxAttempts',
];

function filterChallengeFields(body) {
  const clean = {};
  ALLOWED_CHALLENGE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) clean[field] = body[field];
  });
  return clean;
}

/**
 * Builds fully normalized QRBlock documents with both canonical fields (code, correctOrder, qrToken, type)
 * and legacy/helper aliases (codeSnippet, originalOrder, qrHash, blockType).
 */
function buildQRBlockDocs(challenge, languageConfigs, blocks) {
  const blockDocs = [];
  const challengeId = challenge._id || challenge.slug;

  if (Array.isArray(languageConfigs) && languageConfigs.length > 0) {
    languageConfigs.forEach((lc) => {
      if (Array.isArray(lc.blocks)) {
        lc.blocks.forEach((b, idx) => {
          const blockId = b.blockId || `B${String(idx + 1).padStart(2, '0')}`;
          const codeVal = b.code !== undefined && b.code !== null && b.code !== ''
            ? b.code
            : (b.codeSnippet !== undefined ? b.codeSnippet : '');
          const orderVal = b.correctOrder !== undefined
            ? b.correctOrder
            : (b.originalOrder !== undefined
              ? b.originalOrder
              : (b.order !== undefined ? b.order : idx + 1));
          const lang = (lc.language || challenge.sourceLanguage || 'python').toLowerCase();
          const token = b.qrToken || b.qrHash || generateQRToken(challengeId, blockId, lang);
          const typeVal = b.role || b.type || b.blockType || 'LOGIC';

          blockDocs.push({
            challengeId,
            blockId,
            title: b.title || `${challenge.title} - ${lang.toUpperCase()} Block ${orderVal}`,
            language: lang,
            code: codeVal,
            codeSnippet: codeVal,
            type: typeVal,
            blockType: typeVal,
            isDecoy: !!b.isDecoy,
            correctOrder: orderVal,
            originalOrder: orderVal,
            displayOrder: lc.revealOrder && lc.revealOrder.indexOf(blockId) !== -1
              ? lc.revealOrder.indexOf(blockId) + 1
              : (b.displayOrder !== undefined ? b.displayOrder : idx + 1),
            orderHint: orderVal,
            qrToken: token,
            qrHash: token,
            points: b.points || 10,
            hint: b.hint || '',
            isInitiallyVisible: !!b.isInitiallyVisible,
            isLocked: !!b.isLocked,
            taskId: b.taskId,
          });
        });
      }
    });
  } else if (Array.isArray(blocks) && blocks.length > 0) {
    blocks.forEach((b, idx) => {
      const blockId = b.blockId || `B${String(idx + 1).padStart(2, '0')}`;
      const codeVal = b.code !== undefined && b.code !== null && b.code !== ''
        ? b.code
        : (b.codeSnippet !== undefined ? b.codeSnippet : '');
      const orderVal = b.correctOrder !== undefined
        ? b.correctOrder
        : (b.originalOrder !== undefined
          ? b.originalOrder
          : (b.order !== undefined ? b.order : idx + 1));
      const lang = (b.language || challenge.sourceLanguage || 'python').toLowerCase();
      const token = b.qrToken || b.qrHash || generateQRToken(challengeId, blockId, lang);
      const typeVal = b.type || b.blockType || b.role || 'LOGIC';

      blockDocs.push({
        challengeId,
        blockId,
        title: b.title || `${challenge.title} - Block ${orderVal}`,
        language: lang,
        code: codeVal,
        codeSnippet: codeVal,
        type: typeVal,
        blockType: typeVal,
        isDecoy: !!b.isDecoy,
        correctOrder: orderVal,
        originalOrder: orderVal,
        displayOrder: b.displayOrder !== undefined ? b.displayOrder : idx + 1,
        orderHint: orderVal,
        qrToken: token,
        qrHash: token,
        points: b.points || 10,
        hint: b.hint || '',
        isInitiallyVisible: !!b.isInitiallyVisible,
        isLocked: !!b.isLocked,
        taskId: b.taskId,
      });
    });
  }

  return blockDocs;
}

exports.createChallenge = asyncHandler(async (req, res) => {
  const { blocks, testCases, languageConfigs } = req.body || {};
  const challengeData = filterChallengeFields(req.body || {});

  // Validate sequenceOrder if supplied
  if (challengeData.sequenceOrder !== undefined && challengeData.sequenceOrder !== null && challengeData.sequenceOrder !== '') {
    const seq = Number(challengeData.sequenceOrder);
    if (![1, 2, 3].includes(seq)) {
      return res.status(400).json({
        success: false,
        message: 'Sequence position must be 1 (Easy), 2 (Medium), or 3 (Hard)',
      });
    }
    const duplicate = await Challenge.findOne({ sequenceOrder: seq });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Sequence position ${seq} is already assigned to challenge "${duplicate.title}"`,
      });
    }
    challengeData.sequenceOrder = seq;
  } else {
    challengeData.sequenceOrder = null;
  }

  // Auto-generate slug if missing
  if (!challengeData.slug && challengeData.title) {
    challengeData.slug = challengeData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  const challenge = await Challenge.create(challengeData);

  // If blocks or languageConfigs are provided explicitly or generated from sourceCode
  const activeLanguageConfigs = languageConfigs || challengeData.languageConfigs;
  if (Array.isArray(activeLanguageConfigs) && activeLanguageConfigs.length > 0) {
    const blockDocs = buildQRBlockDocs(challenge, activeLanguageConfigs, null);
    if (blockDocs.length > 0) {
      await QRBlock.insertMany(blockDocs);
      const totalBlocks = activeLanguageConfigs[0]?.blocks?.length || blockDocs.length;
      await Challenge.findByIdAndUpdate(challenge._id, { 'blockConfig.totalBlocks': totalBlocks });
    }
  } else if (Array.isArray(blocks) && blocks.length > 0) {
    const blockDocs = buildQRBlockDocs(challenge, null, blocks);
    if (blockDocs.length > 0) {
      await QRBlock.insertMany(blockDocs);
      await Challenge.findByIdAndUpdate(challenge._id, { 'blockConfig.totalBlocks': blockDocs.length });
    }
  } else if (challenge.sourceCode && challenge.sourceCode.trim()) {
    // Automatically generate blocks and reveal tasks
    const { blocks: generated, tasks: generatedTasks } = generateCodeBlocks({
      sourceCode: challenge.sourceCode,
      language: challenge.sourceLanguage,
      strategy: challenge.splitStrategy || 'statement',
      initialVisibleCount: challenge.blockConfig?.initialVisibleCount || 3,
      randomize: challenge.blockConfig?.randomizeOrder !== false,
      slug: challenge.slug,
    });
    const blockDocs = generated.map((b) => ({ ...b, challengeId: challenge._id }));
    await QRBlock.insertMany(blockDocs);
    await Challenge.findByIdAndUpdate(challenge._id, {
      'blockConfig.totalBlocks': blockDocs.length,
      tasks: (!challenge.tasks || challenge.tasks.length === 0) ? generatedTasks : challenge.tasks,
    });
  }

  // If test cases provided
  if (Array.isArray(testCases) && testCases.length > 0) {
    const testDocs = testCases.map((tc, idx) => ({
      challengeId: challenge._id,
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || '',
      isHidden: !!tc.isHidden,
      weight: tc.weight || 20,
      timeoutSeconds: tc.timeoutSeconds || 5,
      isEnabled: tc.isEnabled !== false,
      orderIndex: idx,
      description: tc.description || '',
    }));
    await TestCase.insertMany(testDocs);
  }

  const finalChallenge = await Challenge.findById(challenge._id);
  res.status(201).json({ success: true, challenge: formatChallengeForAdmin(finalChallenge) });
});

exports.updateChallenge = asyncHandler(async (req, res) => {
  const { blocks, testCases, languageConfigs } = req.body || {};
  const updateData = filterChallengeFields(req.body || {});

  const existing = await findAdminChallenge(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  // Validate sequenceOrder if supplied
  if (updateData.sequenceOrder !== undefined) {
    if (updateData.sequenceOrder === null || updateData.sequenceOrder === '' || updateData.sequenceOrder === 'none') {
      updateData.sequenceOrder = null;
    } else {
      const seq = Number(updateData.sequenceOrder);
      if (![1, 2, 3].includes(seq)) {
        return res.status(400).json({
          success: false,
          message: 'Sequence position must be 1 (Easy), 2 (Medium), or 3 (Hard)',
        });
      }
      const duplicate = await Challenge.findOne({
        sequenceOrder: seq,
        _id: { $ne: existing._id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Sequence position ${seq} is already assigned to challenge "${duplicate.title}"`,
        });
      }
      updateData.sequenceOrder = seq;
    }
  }

  const challenge = await Challenge.findByIdAndUpdate(existing._id, updateData, { new: true });

  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  // Update blocks if languageConfigs or blocks provided
  const activeLanguageConfigs = languageConfigs || updateData.languageConfigs;
  if (Array.isArray(activeLanguageConfigs) && activeLanguageConfigs.length > 0) {
    await QRBlock.deleteMany({
      $or: [{ challengeId: challenge._id }, { challengeId: challenge.slug }],
    });
    const blockDocs = buildQRBlockDocs(challenge, activeLanguageConfigs, null);
    if (blockDocs.length > 0) {
      await QRBlock.insertMany(blockDocs);
    }
    const targetBlockCount = activeLanguageConfigs[0]?.blocks?.length || blockDocs.length;
    challenge.blockConfig = challenge.blockConfig || {};
    challenge.blockConfig.totalBlocks = targetBlockCount;
    await challenge.save();
  } else if (Array.isArray(blocks)) {
    await QRBlock.deleteMany({
      $or: [{ challengeId: challenge._id }, { challengeId: challenge.slug }],
    });
    const blockDocs = buildQRBlockDocs(challenge, null, blocks);
    if (blockDocs.length > 0) {
      await QRBlock.insertMany(blockDocs);
    }
    challenge.blockConfig = challenge.blockConfig || {};
    challenge.blockConfig.totalBlocks = blockDocs.length;
    await challenge.save();
  }

  // Update test cases if provided
  if (Array.isArray(testCases)) {
    await TestCase.deleteMany({ challengeId: challenge._id });
    const testDocs = testCases.map((tc, idx) => ({
      challengeId: challenge._id,
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || '',
      isHidden: !!tc.isHidden,
      weight: tc.weight || 20,
      timeoutSeconds: tc.timeoutSeconds || 5,
      isEnabled: tc.isEnabled !== false,
      orderIndex: idx,
      description: tc.description || '',
    }));
    if (testDocs.length > 0) {
      await TestCase.insertMany(testDocs);
    }
  }

  const populated = await Challenge.findById(challenge._id);
  res.json({ success: true, challenge: formatChallengeForAdmin(populated) });
});

exports.deleteChallenge = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let challenge = null;

  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    challenge = await Challenge.findById(id);
  }
  if (!challenge) {
    challenge = await Challenge.findOne({
      $or: [{ slug: id }, { slug: String(id).toLowerCase() }],
    });
  }

  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  const idsToMatch = [challenge._id, challenge._id.toString()];
  if (challenge.slug) {
    idsToMatch.push(challenge.slug);
    idsToMatch.push(String(challenge.slug).toLowerCase());
  }

  await Promise.allSettled([
    Challenge.findByIdAndDelete(challenge._id),
    QRBlock.deleteMany({ challengeId: { $in: idsToMatch } }),
    TestCase.deleteMany({ challengeId: { $in: idsToMatch } }),
    Submission.deleteMany({ challengeId: { $in: idsToMatch } }),
    ParticipantSession.deleteMany({ challengeId: { $in: idsToMatch } }),
  ]);

  res.json({ success: true, message: `Challenge "${challenge.title}" and associated resources deleted successfully` });
});

exports.duplicateChallenge = asyncHandler(async (req, res) => {
  const source = await findAdminChallenge(req.params.id);
  if (!source) {
    return res.status(404).json({ success: false, message: 'Source challenge not found' });
  }

  const [blocks, testCases] = await Promise.all([
    QRBlock.find({ challengeId: source._id }),
    TestCase.find({ challengeId: source._id }),
  ]);

  const timestamp = Date.now().toString().slice(-4);
  const clonedData = source.toObject();
  delete clonedData._id;
  delete clonedData.createdAt;
  delete clonedData.updatedAt;

  clonedData.title = `${source.title} (Copy)`;
  clonedData.slug = `${source.slug}-copy-${timestamp}`;
  clonedData.status = 'Draft';

  const clonedChallenge = await Challenge.create(clonedData);

  if (blocks.length > 0) {
    const clonedBlocks = blocks.map((b) => {
      const obj = b.toObject();
      delete obj._id;
      obj.challengeId = clonedChallenge._id;
      const lang = (b.language || 'python').toLowerCase();
      const token = generateQRToken(clonedChallenge._id, b.blockId, lang);
      obj.qrToken = token;
      obj.qrHash = token;
      return obj;
    });
    await QRBlock.insertMany(clonedBlocks);
  }

  if (testCases.length > 0) {
    const clonedTests = testCases.map((tc) => {
      const obj = tc.toObject();
      delete obj._id;
      obj.challengeId = clonedChallenge._id;
      return obj;
    });
    await TestCase.insertMany(clonedTests);
  }

  res.status(201).json({ success: true, challenge: clonedChallenge });
});

/**
 * BLOCK PARSING AND GENERATION
 */
exports.generateBlocks = asyncHandler(async (req, res) => {
  const { sourceCode, language, strategy, initialVisibleCount, randomize } = req.body;
  const challenge = req.params.id !== 'preview' ? await Challenge.findById(req.params.id) : null;

  const code = sourceCode || challenge?.sourceCode || '';
  const lang = language || challenge?.sourceLanguage || 'java';
  const strat = strategy || challenge?.splitStrategy || 'statement';
  const initialCount = initialVisibleCount !== undefined ? initialVisibleCount : (challenge?.blockConfig?.initialVisibleCount || 3);
  const shouldRandomize = randomize !== undefined ? randomize : (challenge?.blockConfig?.randomizeOrder !== false);

  if (!code.trim()) {
    return res.status(400).json({ success: false, message: 'Source code cannot be empty' });
  }

  const { blocks, tasks } = generateCodeBlocks({
    sourceCode: code,
    language: lang,
    strategy: strat,
    initialVisibleCount: Number(initialCount),
    randomize: !!shouldRandomize,
    slug: challenge?.slug || 'CH',
  });

  res.json({ success: true, blocks, tasks, totalBlocks: blocks.length });
});

exports.getChallengeBlocks = asyncHandler(async (req, res) => {
  const blocks = await QRBlock.find({ challengeId: req.params.id }).sort({ originalOrder: 1 });
  res.json({ success: true, blocks });
});

exports.updateChallengeBlocks = asyncHandler(async (req, res) => {
  const { blocks } = req.body;
  const challengeId = req.params.id;

  if (!Array.isArray(blocks)) {
    return res.status(400).json({ success: false, message: 'Blocks array required' });
  }

  const challenge = await findAdminChallenge(challengeId);
  const targetId = challenge ? challenge._id : challengeId;

  await QRBlock.deleteMany({
    $or: [{ challengeId: targetId }, { challengeId }],
  });

  const blockDocs = buildQRBlockDocs(challenge || { _id: targetId, slug: 'CH' }, null, blocks);

  if (blockDocs.length > 0) {
    await QRBlock.insertMany(blockDocs);
  }

  if (challenge) {
    await Challenge.findByIdAndUpdate(challenge._id, { 'blockConfig.totalBlocks': blockDocs.length });
  }

  res.json({ success: true, blocks: blockDocs });
});

/**
 * TEST CASES
 */
exports.getTestCases = asyncHandler(async (req, res) => {
  const testCases = await TestCase.find({ challengeId: req.params.id }).sort({ orderIndex: 1 });
  res.json({ success: true, testCases });
});

exports.updateTestCases = asyncHandler(async (req, res) => {
  const { testCases } = req.body;
  const challengeId = req.params.id;

  if (!Array.isArray(testCases)) {
    return res.status(400).json({ success: false, message: 'TestCases array required' });
  }

  await TestCase.deleteMany({ challengeId });
  const docs = testCases.map((tc, idx) => ({
    challengeId,
    input: tc.input || '',
    expectedOutput: tc.expectedOutput || '',
    isHidden: !!tc.isHidden,
    weight: tc.weight || 20,
    timeoutSeconds: tc.timeoutSeconds || 5,
    isEnabled: tc.isEnabled !== false,
    orderIndex: idx,
    description: tc.description || '',
  }));

  if (docs.length > 0) {
    await TestCase.insertMany(docs);
  }

  res.json({ success: true, testCases: docs });
});

/**
 * PARTICIPANTS MANAGEMENT
 */
exports.getParticipants = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const userFilter = { role: 'participant' };

  if (search) {
    userFilter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { participantId: { $regex: search, $options: 'i' } },
      { teamName: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(userFilter).select('-password');
  const userIds = users.map((u) => u._id);

  const [submissions, sessions] = await Promise.all([
    Submission.find({ userId: { $in: userIds } }),
    ParticipantSession.find({ userId: { $in: userIds } }),
  ]);

  const participants = users.map((u) => {
    const userSubs = submissions.filter((s) => s.userId.toString() === u._id.toString());
    const userSessions = sessions.filter((s) => s.userId.toString() === u._id.toString());

    const acceptedCount = userSubs.filter((s) => s.status === 'ACCEPTED').length;
    const wrongCount = userSubs.filter((s) => s.status === 'WRONG_ANSWER').length;
    const solvedChallengeIds = new Set(
      userSubs.filter((s) => s.status === 'ACCEPTED').map((s) => s.challengeId.toString())
    );

    const totalScore = userSubs.reduce((acc, s) => {
      return acc + (s.score || (s.status === 'ACCEPTED' ? 100 : 0));
    }, 0);

    const totalReveals = userSessions.reduce((acc, s) => acc + (s.revealsCount || 0), 0);
    const hasActiveSession = userSessions.some((s) => !s.isCompleted && s.status === 'ACTIVE');

    let participantStatus = 'Idle';
    if (!u.isActive) participantStatus = 'Disabled';
    else if (hasActiveSession) participantStatus = 'Active';
    else if (userSessions.some((s) => s.isCompleted) || solvedChallengeIds.size > 0) participantStatus = 'Completed';

    return {
      _id: u._id,
      participantId: u.participantId || `MC-${u._id.toString().slice(-4).toUpperCase()}`,
      name: u.name,
      email: u.email,
      college: u.college || '',
      department: u.department || '',
      teamName: u.teamName || u.participantId || u.name,
      challengesAttempted: userSessions.length || (userSubs.length > 0 ? 1 : 0),
      challengesCompleted: solvedChallengeIds.size,
      score: totalScore,
      submissionsCount: userSubs.length,
      acceptedCount,
      wrongCount,
      revealsCount: totalReveals,
      status: participantStatus,
      isActive: u.isActive,
      lastActive: userSessions[0]?.lastActivityAt || u.updatedAt,
    };
  });

  if (status && status !== 'All') {
    return res.json({ success: true, participants: participants.filter((p) => p.status === status) });
  }

  res.json({ success: true, participants });
});

exports.getParticipantById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'Participant not found' });
  }

  const [rawSubmissions, rawSessions] = await Promise.all([
    Submission.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
    ParticipantSession.find({ userId: user._id }).sort({ startTime: -1 }).lean(),
  ]);

  const [submissions, sessions] = await Promise.all([
    Promise.all(
      rawSubmissions.map(async (s) => {
        if (s.challengeId && /^[0-9a-fA-F]{24}$/.test(String(s.challengeId))) {
          const chal = await Challenge.findById(s.challengeId).select('title difficulty points').lean();
          return { ...s, challengeId: chal || s.challengeId };
        }
        return {
          ...s,
          challengeId: typeof s.challengeId === 'string'
            ? { title: s.challengeId, difficulty: 'Medium', points: 100 }
            : s.challengeId,
        };
      })
    ),
    Promise.all(
      rawSessions.map(async (s) => {
        if (s.challengeId && /^[0-9a-fA-F]{24}$/.test(String(s.challengeId))) {
          const chal = await Challenge.findById(s.challengeId).select('title duration').lean();
          return { ...s, challengeId: chal || s.challengeId };
        }
        return {
          ...s,
          challengeId: typeof s.challengeId === 'string'
            ? { title: s.challengeId, duration: 1200 }
            : s.challengeId,
        };
      })
    ),
  ]);

  const acceptedCount = submissions.filter((s) => s.status === 'ACCEPTED').length;
  const totalScore = submissions.reduce((acc, s) => acc + (s.score || (s.status === 'ACCEPTED' ? 100 : 0)), 0);
  const revealsUsed = sessions.reduce((acc, s) => acc + (s.revealsCount || 0), 0);

  res.json({
    success: true,
    participant: {
      ...user.toObject(),
      participantId: user.participantId || `MC-${user._id.toString().slice(-4).toUpperCase()}`,
      stats: {
        totalScore,
        acceptedCount,
        submissionsCount: submissions.length,
        revealsUsed,
        accuracy: submissions.length > 0 ? `${Math.round((acceptedCount / submissions.length) * 100)}%` : '0%',
      },
      submissions,
      sessions,
    },
  });
});

exports.toggleParticipantStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'Participant not found' });
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, isActive: user.isActive });
});

exports.resetParticipant = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  await Promise.all([
    Submission.deleteMany({ userId }),
    ParticipantSession.deleteMany({ userId }),
  ]);
  res.json({ success: true, message: 'Participant session and submission progress reset successfully' });
});

exports.deleteParticipant = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Participant not found' });
  }
  if (user.role === 'admin') {
    return res.status(400).json({ success: false, message: 'Cannot delete admin account' });
  }

  await Promise.all([
    User.findByIdAndDelete(userId),
    ParticipantSession.deleteMany({ userId }),
    Submission.deleteMany({ userId }),
  ]);

  res.json({
    success: true,
    message: `Participant '${user.name}' (${user.participantId || user.email}) deleted successfully.`,
  });
});


/**
 * SESSION MANAGEMENT
 */
exports.getSessions = asyncHandler(async (req, res) => {
  const sessions = await ParticipantSession.find()
    .populate('userId', 'name email teamName college')
    .populate('challengeId', 'title difficulty points duration timeLimitSeconds')
    .sort({ lastActivityAt: -1 });

  const enriched = sessions.map((s) => {
    const elapsed = Math.round((Date.now() - new Date(s.startTime).getTime()) / 1000);
    const duration = s.durationSeconds || 1200;
    const remaining = Math.max(0, duration - elapsed);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;

    return {
      _id: s._id,
      participant: s.userId?.name || 'Anonymous',
      email: s.userId?.email || 'N/A',
      college: s.userId?.college || 'N/A',
      challenge: s.challengeId?.title || 'Unknown',
      currentScore: s.scoreAwarded || 0,
      timeRemaining: s.isCompleted ? '00:00' : `${mins}:${String(secs).padStart(2, '0')}`,
      blocksRevealed: s.revealsCount || 0,
      currentBlockCount: (s.revealedBlockIds || []).length,
      status: s.status || (s.isCompleted ? 'COMPLETED' : 'ACTIVE'),
      isCompleted: s.isCompleted,
      lastActivityAt: s.lastActivityAt || s.updatedAt,
      startTime: s.startTime,
    };
  });

  res.json({ success: true, sessions: enriched });
});

exports.endSession = asyncHandler(async (req, res) => {
  const session = await ParticipantSession.findById(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  session.isCompleted = true;
  session.status = 'COMPLETED';
  session.endTime = new Date();
  await session.save();

  res.json({ success: true, message: 'Session terminated', session });
});

exports.extendSession = asyncHandler(async (req, res) => {
  const { minutes = 5 } = req.body;
  const session = await ParticipantSession.findById(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  session.durationSeconds = (session.durationSeconds || 1200) + Number(minutes) * 60;
  session.isCompleted = false;
  session.status = 'ACTIVE';
  await session.save();

  res.json({ success: true, message: `Session extended by ${minutes} minutes`, session });
});

exports.resetSession = asyncHandler(async (req, res) => {
  const session = await ParticipantSession.findById(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  session.scannedBlocks = [];
  session.revealedBlockIds = [];
  session.revealsCount = 0;
  session.scoreAwarded = 0;
  session.penaltyCount = 0;
  session.wrongAttemptsCount = 0;
  session.startTime = new Date();
  session.endTime = null;
  session.isCompleted = false;
  session.status = 'ACTIVE';
  await session.save();

  res.json({ success: true, message: 'Session reset successfully', session });
});

/**
 * SUBMISSION AUDIT & MANAGEMENT
 */
exports.getSubmissions = asyncHandler(async (req, res) => {
  const { status, challengeId, participantId, language } = req.query;
  const filter = {};

  if (status && status !== 'All') filter.status = status;
  if (challengeId && challengeId !== 'All') filter.challengeId = challengeId;
  if (participantId && participantId !== 'All') filter.userId = participantId;
  if (language && language !== 'All') filter.language = language;

  const submissions = await Submission.find(filter)
    .populate('userId', 'name email')
    .populate('challengeId', 'title slug points')
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({ success: true, submissions });
});

exports.getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('challengeId');

  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }

  // Fetch expected blocks for comparison
  const expectedBlocks = await QRBlock.find({ challengeId: submission.challengeId?._id }).sort({ originalOrder: 1 });

  res.json({
    success: true,
    submission: {
      ...submission.toObject(),
      expectedBlocks: expectedBlocks.map((b) => ({
        blockId: b.blockId,
        originalOrder: b.originalOrder,
        code: b.codeSnippet,
      })),
    },
  });
});

/**
 * LEADERBOARD
 */
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const rankings = await getLeaderboardData();
  res.json({ success: true, rankings });
});

/**
 * EXPORT EXCEL & PDF
 */
exports.exportExcel = asyncHandler(async (req, res) => {
  const buffer = await generateExcelReport();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `blind-coding-results-${dateStr}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

exports.exportPdf = asyncHandler(async (req, res) => {
  const buffer = await generatePdfReport();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `blind-coding-results-${dateStr}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

/**
 * GLOBAL SETTINGS
 */
exports.getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  res.json({ success: true, settings });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(req.body);
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }
  res.json({ success: true, message: 'Competition settings updated successfully', settings });
});

/**
 * Helper to escape CSV values and prevent formula injection (=, +, -, @)
 */
function sanitizeCSVCell(val) {
  if (val === null || val === undefined) return '""';
  let s = String(val).trim();
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s;
  }
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * GET /api/admin/leaderboard/export?format=csv|xlsx
 * Exports official competition leaderboard results with CSV formula protection.
 */
exports.exportLeaderboard = asyncHandler(async (req, res) => {
  const format = (req.query.format || 'csv').toLowerCase();
  const rankings = await getLeaderboardData({ forceFresh: true });

  const rows = rankings.map((r) => ({
    Rank: r.rank,
    Name: r.name,
    'Participant ID': r.participantId,
    College: r.college,
    Department: r.department,
    Email: r.email,
    'Challenges Solved': r.challengesSolved,
    'Score (marks)': r.score,
    'Total Time': r.formattedTime || r.timeFormatted || '0m 00s',
    'Last Submission Time': r.lastSubmissionTime ? new Date(r.lastSubmissionTime).toISOString() : 'N/A',
  }));

  const dateStr = new Date().toISOString().split('T')[0];

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="mindcraft-results-${dateStr}.xlsx"`);
    return res.send(buffer);
  }

  // Default: CSV format
  const headers = [
    'Rank',
    'Name',
    'Participant ID',
    'College',
    'Department',
    'Email',
    'Challenges Solved',
    'Score (marks)',
    'Total Time',
    'Last Submission Time',
  ];

  const csvRows = [headers.join(',')];
  rows.forEach((r) => {
    csvRows.push([
      sanitizeCSVCell(r.Rank),
      sanitizeCSVCell(r.Name),
      sanitizeCSVCell(r['Participant ID']),
      sanitizeCSVCell(r.College),
      sanitizeCSVCell(r.Department),
      sanitizeCSVCell(r.Email),
      sanitizeCSVCell(r['Challenges Solved']),
      sanitizeCSVCell(r['Score (marks)']),
      sanitizeCSVCell(r['Total Time']),
      sanitizeCSVCell(r['Last Submission Time']),
    ].join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="mindcraft-results-${dateStr}.csv"`);
  res.send(csvContent);
});

/**
 * GET /api/admin/participants/export?format=csv|xlsx
 * Exports registered participant name list.
 */
exports.exportParticipants = asyncHandler(async (req, res) => {
  const format = (req.query.format || 'csv').toLowerCase();
  const users = await User.find({
    role: { $ne: 'admin' },
    email: { $ne: 'admin@mindcraft.local' },
  })
    .select('name participantId college department email createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const rows = users.map((u) => ({
    Name: u.name,
    'Participant ID': u.participantId || `MC-${String(u._id).slice(-4).toUpperCase()}`,
    College: u.college || 'N/A',
    Department: u.department || 'N/A',
    Email: u.email,
    'Registered At': u.createdAt ? new Date(u.createdAt).toISOString() : 'N/A',
  }));

  const dateStr = new Date().toISOString().split('T')[0];

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="mindcraft-participants-${dateStr}.xlsx"`);
    return res.send(buffer);
  }

  const headers = ['Name', 'Participant ID', 'College', 'Department', 'Email', 'Registered At'];
  const csvRows = [headers.join(',')];
  rows.forEach((r) => {
    csvRows.push([
      sanitizeCSVCell(r.Name),
      sanitizeCSVCell(r['Participant ID']),
      sanitizeCSVCell(r.College),
      sanitizeCSVCell(r.Department),
      sanitizeCSVCell(r.Email),
      sanitizeCSVCell(r['Registered At']),
    ].join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="mindcraft-participants-${dateStr}.csv"`);
  res.send(csvContent);
});

/**
 * POST /api/admin/leaderboard/freeze
 * Freeze/unfreeze the public leaderboard.
 */
exports.freezeLeaderboardToggle = asyncHandler(async (req, res) => {
  const { isFrozen = true } = req.body || {};
  await freezeLeaderboard(!!isFrozen);
  res.json({
    success: true,
    message: isFrozen ? 'Leaderboard is now frozen.' : 'Leaderboard unfrozen (live updates resumed).',
    isFrozen: !!isFrozen,
  });
});

/**
 * PUT /api/admin/change-password
 * Allows the logged-in admin to update their password.
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
  }

  const adminUser = await User.findById(req.user._id);
  if (!adminUser) {
    return res.status(404).json({ success: false, message: 'Admin account not found' });
  }

  const isMatch = await bcrypt.compare(currentPassword, adminUser.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Incorrect current password' });
  }

  adminUser.password = await bcrypt.hash(newPassword, 10);
  await adminUser.save();

  res.json({ success: true, message: 'Admin password changed successfully' });
});

/**
 * POST /api/admin/challenges/:id/generate-qr
 * Generates and returns printable QR code tokens and images for a challenge.
 */
exports.generateChallengeQRs = asyncHandler(async (req, res) => {
  const challenge = await findAdminChallenge(req.params.id);
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  const blocks = await QRBlock.find({
    $or: [{ challengeId: challenge._id }, { challengeId: challenge.slug }],
  }).sort({ correctOrder: 1, displayOrder: 1 });

  const qrItems = await Promise.all(
    blocks.map(async (b) => {
      const token = b.qrToken || generateQRToken(challenge.slug, b.blockId, b.language);
      if (!b.qrToken) {
        b.qrToken = token;
        await b.save();
      }
      const qrDataUrl = await QRCode.toDataURL(token, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 2,
      });

      return {
        blockId: b.blockId,
        title: b.title,
        language: b.language,
        qrToken: token,
        qrDataUrl,
        type: b.type,
        isDecoy: b.isDecoy,
        correctOrder: b.correctOrder,
      };
    })
  );

  res.json({
    success: true,
    challenge: { id: challenge._id, title: challenge.title, slug: challenge.slug },
    blocks: qrItems,
  });
});

