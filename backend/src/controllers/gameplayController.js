/**
 * gameplayController.js
 *
 * Server-authoritative game loop endpoints:
 *   POST /api/challenges/:id/start-session   – start/resume session, pick language, return first task
 *   GET  /api/challenges/:id/current-task     – get current task (answer NEVER exposed)
 *   POST /api/challenges/:id/submit-task      – validate answer server-side, unlock block if correct
 *   GET  /api/challenges/:id/progress         – full session state for recovery
 */

const asyncHandler = require('../utils/asyncHandler');
const Challenge = require('../models/Challenge');
const ParticipantSession = require('../models/ParticipantSession');
const User = require('../models/User');
const { checkChallengeLock } = require('../services/challenge/progressionService');

// ── helpers ────────────────────────────────────────────────────────────────

/** Lookup challenge by ObjectId or slug */
async function findChallenge(idOrSlug) {
  if (!idOrSlug) return null;
  if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
    const c = await Challenge.findById(idOrSlug);
    if (c) return c;
  }
  return Challenge.findOne({
    $or: [{ slug: idOrSlug }, { slug: String(idOrSlug).toLowerCase() }],
  });
}

/** Normalise answer for comparison */
function normalizeStr(s) {
  return String(s ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
    .toLowerCase();
}

/**
 * Sanitise a task for participant (strip answer, explain)
 */
function sanitiseTask(task, quizIdx = 0) {
  if (!task) return null;
  const pool = task.quizPool || [];
  if (pool.length === 0) return null;
  const quiz = pool[quizIdx % pool.length];
  return {
    taskId: task.taskId,
    title: task.title,
    description: task.description || '',
    order: task.order,
    quiz: {
      quizId: quiz.quizId,
      type: quiz.type,
      prompt: quiz.prompt,
      options: quiz.options || [],
      concept: quiz.concept || '',
      // answer and explain are NEVER sent
    },
  };
}

/**
 * Get the language config for a challenge + language
 */
function getLangConfig(challenge, language) {
  if (!challenge.languageConfigs || challenge.languageConfigs.length === 0) return null;
  return challenge.languageConfigs.find((lc) => lc.language === language) || null;
}

/**
 * Get reward blockId for a task in a given language
 */
function getRewardBlockId(task, language) {
  if (!task.rewards) return null;
  // Mongoose Map: use .get()
  if (typeof task.rewards.get === 'function') {
    return task.rewards.get(language) || null;
  }
  return task.rewards[language] || null;
}

/**
 * Get block data by blockId from languageConfig
 */
function getBlockData(langConfig, blockId) {
  if (!langConfig || !langConfig.blocks) return null;
  return langConfig.blocks.find((b) => b.blockId === blockId) || null;
}

/**
 * Get tasks tailored for a specific language (matching reward block mappings)
 */
function getTasksForLanguage(challenge, language) {
  if (!challenge || !challenge.tasks || challenge.tasks.length === 0) return [];
  if (!language) {
    return [...challenge.tasks].sort((a, b) => a.order - b.order);
  }
  const filtered = challenge.tasks.filter((task) => {
    if (!task.rewards) return true;
    const reward = typeof task.rewards.get === 'function'
      ? task.rewards.get(language)
      : task.rewards[language];
    return Boolean(reward);
  });
  const list = filtered.length > 0 ? filtered : challenge.tasks;
  return [...list].sort((a, b) => a.order - b.order);
}

/**
/**
 * Resolve authenticated user
 */
async function getOrCreateSessionUser(req) {
  return req.user || null;
}

// ── START SESSION ──────────────────────────────────────────────────────────

exports.startSession = asyncHandler(async (req, res) => {
  const user = await getOrCreateSessionUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please register first.' });
  }

  const challengeId = req.params.id;
  let { language } = req.body || {};

  const challenge = await findChallenge(challengeId);
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  if (!(await checkChallengeLock(req, res, challenge))) {
    return;
  }

  // If no language provided or not configured, default to first available language
  let langConfig = language ? getLangConfig(challenge, language) : null;
  if (!langConfig) {
    const fallbackLang = challenge.languageConfigs?.[0]?.language || 'python';
    language = fallbackLang;
    langConfig = getLangConfig(challenge, language);
  }

  if (!langConfig) {
    return res.status(400).json({
      success: false,
      message: `No supported programming languages configured for this challenge`,
    });
  }

  if (!challenge.tasks || challenge.tasks.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'This challenge has no tasks configured',
    });
  }

  // Sort tasks by order for selected language
  const sortedTasks = getTasksForLanguage(challenge, language);

  // Check for existing session
  let session = null;
  if (user) {
    session = await ParticipantSession.findOne({
      userId: user._id,
      challengeId: challenge._id,
    });
  }


  if (session && (session.status === 'COMPLETED' || session.status === 'EXPIRED' || session.isCompleted)) {
    // Participant is retrying the challenge after timeout / non-accepted conclusion
    session.status = 'ACTIVE';
    session.isCompleted = false;
    session.selectedLanguage = language;
    session.completedTaskIds = [];
    session.currentTaskIndex = 0;
    session.currentQuizIndex = 0;
    session.taskAttempts = [];
    session.revealedBlockIds = [];
    session.revealsCount = 0;
    session.revealEvents = [];
    session.durationSeconds = challenge.timeLimitSeconds || 1200;
    session.totalPenaltySeconds = 0;
    session.wrongAttemptsCount = 0;
    session.startedAt = new Date();
    session.lastActivityAt = new Date();
    session.completedAt = null;
    await session.save();
  } else if (session) {
    // Resume existing session – update language if not locked
    if (session.completedTaskIds.length === 0) {
      session.selectedLanguage = language;
    }
    session.lastActivityAt = new Date();
    await session.save();
  } else if (user) {
    // Create new session
    session = await ParticipantSession.create({
      userId: user._id,
      challengeId: challenge._id,
      selectedLanguage: language,
      completedTaskIds: [],
      currentTaskIndex: 0,
      currentQuizIndex: 0,
      taskAttempts: [],
      revealedBlockIds: [],
      revealsCount: 0,
      revealEvents: [],
      durationSeconds: challenge.timeLimitSeconds || 1200,
      totalPenaltySeconds: 0,
    });
  }

  // Build response: first task (sanitised), no blocks yet
  const currentTaskIdx = session?.currentTaskIndex || 0;
  const currentTask = sortedTasks[currentTaskIdx];
  const quizIdx = session?.currentQuizIndex || 0;

  res.json({
    success: true,
    session: {
      sessionId: session?._id || null,
      challengeId: challenge._id,
      language,
      startTime: session?.startTime || Date.now(),
      durationSeconds: challenge.timeLimitSeconds || 1200,
      completedTaskIds: session?.completedTaskIds || [],
      currentTaskIndex: currentTaskIdx,
      totalTasks: sortedTasks.length,
      totalPenaltySeconds: session?.totalPenaltySeconds || 0,
      unlockedBlocks: buildUnlockedBlocks(challenge, session, language),
      status: session?.status || 'ACTIVE',
    },
    currentTask: sanitiseTask(currentTask, quizIdx),
    totalTasks: sortedTasks.length,
  });
});

// ── GET CURRENT TASK ───────────────────────────────────────────────────────

exports.getCurrentTask = asyncHandler(async (req, res) => {
  const challengeId = req.params.id;
  const challenge = await findChallenge(challengeId);
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  if (!(await checkChallengeLock(req, res, challenge))) {
    return;
  }

  const user = await getOrCreateSessionUser(req);
  let session = null;
  if (user) {
    session = await ParticipantSession.findOne({
      userId: user._id,
      challengeId: challenge._id,
    });
  }

  if (!session) {
    return res.status(400).json({ success: false, message: 'No active session found. Please start the challenge first.' });
  }

  const sortedTasks = getTasksForLanguage(challenge, session.selectedLanguage);

  // Check if all tasks completed
  if (session.currentTaskIndex >= sortedTasks.length) {
    return res.json({
      success: true,
      allTasksCompleted: true,
      currentTask: null,
      completedTaskIds: session.completedTaskIds,
      totalTasks: sortedTasks.length,
      unlockedBlocks: buildUnlockedBlocks(challenge, session, session.selectedLanguage),
    });
  }

  const currentTask = sortedTasks[session.currentTaskIndex];
  const quizIdx = session.currentQuizIndex || 0;

  // Check if there's a cooldown active
  const taskAttempt = session.taskAttempts.find((ta) => ta.taskId === currentTask.taskId);
  let cooldownRemaining = 0;
  if (taskAttempt?.cooldownUntil) {
    cooldownRemaining = Math.max(0, Math.ceil((new Date(taskAttempt.cooldownUntil) - Date.now()) / 1000));
  }

  res.json({
    success: true,
    allTasksCompleted: false,
    currentTask: sanitiseTask(currentTask, quizIdx),
    currentTaskIndex: session.currentTaskIndex,
    completedTaskIds: session.completedTaskIds,
    totalTasks: sortedTasks.length,
    totalPenaltySeconds: session.totalPenaltySeconds || 0,
    cooldownRemaining,
    unlockedBlocks: buildUnlockedBlocks(challenge, session, session.selectedLanguage),
  });
});

// ── SUBMIT TASK ANSWER ────────────────────────────────────────────────────

exports.submitTaskAnswer = asyncHandler(async (req, res) => {
  const challengeId = req.params.id;
  const { answer } = req.body;

  if (answer === undefined || answer === null || answer === '') {
    return res.status(400).json({ success: false, message: 'Answer is required' });
  }

  const challenge = await findChallenge(challengeId);
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  if (!(await checkChallengeLock(req, res, challenge))) {
    return;
  }

  const user = await getOrCreateSessionUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const session = await ParticipantSession.findOne({
    userId: user._id,
    challengeId: challenge._id,
  });

  if (!session) {
    return res.status(400).json({ success: false, message: 'No active session found' });
  }

  if (session.status === 'COMPLETED') {
    return res.status(400).json({ success: false, message: 'Challenge already completed' });
  }

  const sortedTasks = getTasksForLanguage(challenge, session.selectedLanguage);

  if (session.currentTaskIndex >= sortedTasks.length) {
    return res.status(400).json({ success: false, message: 'All tasks already completed' });
  }

  const currentTask = sortedTasks[session.currentTaskIndex];
  const language = session.selectedLanguage;
  const quizIdx = session.currentQuizIndex || 0;
  const pool = currentTask.quizPool || [];
  if (pool.length === 0) {
    return res.status(500).json({ success: false, message: 'Task has no quiz questions' });
  }

  const quiz = pool[quizIdx % pool.length];

  // ── Check cooldown ──
  let taskAttempt = session.taskAttempts.find((ta) => ta.taskId === currentTask.taskId);
  if (taskAttempt?.cooldownUntil && new Date(taskAttempt.cooldownUntil) > Date.now()) {
    const remaining = Math.ceil((new Date(taskAttempt.cooldownUntil) - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      message: `Cooldown active. Wait ${remaining} seconds.`,
      cooldownRemaining: remaining,
    });
  }

  // ── Validate answer ──
  let correct = false;
  if (quiz.type === 'MCQ') {
    correct = Number(answer) === Number(quiz.answer);
  } else if (quiz.type === 'OUTPUT_PREDICTION' || quiz.type === 'SHORT_ANSWER') {
    correct = normalizeStr(answer) === normalizeStr(quiz.answer);
  } else if (quiz.type === 'FILL_BLANK') {
    const acceptedAnswers = Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer];
    correct = acceptedAnswers.some((a) => normalizeStr(answer) === normalizeStr(a));
  } else if (quiz.type === 'CODE_ORDER') {
    // answer should be an array of line indices or strings
    const expectedArr = Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer];
    const submittedArr = Array.isArray(answer) ? answer : [answer];
    correct = JSON.stringify(submittedArr.map(String)) === JSON.stringify(expectedArr.map(String));
  }

  // ── Update task attempts ──
  if (!taskAttempt) {
    taskAttempt = {
      taskId: currentTask.taskId,
      attempts: 0,
      wrongAnswers: 0,
      penaltySeconds: 0,
      cooldownUntil: null,
    };
    session.taskAttempts.push(taskAttempt);
    taskAttempt = session.taskAttempts[session.taskAttempts.length - 1];
  }
  taskAttempt.attempts += 1;

  if (correct) {
    // ── CORRECT ANSWER ──
    taskAttempt.completedAt = new Date();
    session.completedTaskIds.push(currentTask.taskId);

    // Unlock the reward block
    const rewardBlockId = getRewardBlockId(currentTask, language);
    let unlockedBlock = null;

    if (rewardBlockId) {
      const langConfig = getLangConfig(challenge, language);
      const blockData = getBlockData(langConfig, rewardBlockId);
      if (blockData && !session.revealedBlockIds.includes(rewardBlockId)) {
        session.revealedBlockIds.push(rewardBlockId);
        session.revealsCount += 1;
        session.revealEvents.push({
          taskId: currentTask.taskId,
          blockId: rewardBlockId,
          penalty: 0,
          timestamp: new Date(),
        });
        unlockedBlock = {
          blockId: blockData.blockId,
          code: blockData.code,
          role: blockData.role,
          language,
        };
      }
    }

    // Advance to next task
    session.currentTaskIndex += 1;
    session.currentQuizIndex = 0;

    // Check if all tasks done
    const allDone = session.currentTaskIndex >= sortedTasks.length;

    session.lastActivityAt = new Date();
    await session.save();

    // Build next task
    const nextTask = allDone ? null : sortedTasks[session.currentTaskIndex];

    return res.json({
      success: true,
      correct: true,
      explain: quiz.explain || '',
      unlockedBlock,
      allTasksCompleted: allDone,
      nextTask: sanitiseTask(nextTask, 0),
      currentTaskIndex: session.currentTaskIndex,
      completedTaskIds: session.completedTaskIds,
      totalTasks: sortedTasks.length,
      totalPenaltySeconds: session.totalPenaltySeconds || 0,
      unlockedBlocks: buildUnlockedBlocks(challenge, session, language),
    });
  } else {
    // ── WRONG ANSWER ──
    // Keep that task and provide ONLY -penalty (no cycling to next question, no cooldown lockout)
    const penalty = currentTask.penalty || 20;

    taskAttempt.wrongAnswers += 1;
    taskAttempt.penaltySeconds += penalty;
    taskAttempt.cooldownUntil = null; // No cooldown lockout

    session.totalPenaltySeconds = (session.totalPenaltySeconds || 0) + penalty;
    session.wrongAttemptsCount = (session.wrongAttemptsCount || 0) + 1;

    // KEEP THAT EXACT SAME TASK AND QUESTION (do NOT cycle currentQuizIndex)
    // session.currentQuizIndex remains unchanged

    session.lastActivityAt = new Date();
    await session.save();

    return res.json({
      success: true,
      correct: false,
      explain: quiz.explain || 'Incorrect answer. Try again!',
      penalty,
      cooldownSeconds: 0,
      cooldownRemaining: 0,
      totalPenaltySeconds: session.totalPenaltySeconds,
    });
  }
});

// ── GET PROGRESS ──────────────────────────────────────────────────────────

exports.getProgress = asyncHandler(async (req, res) => {
  const challengeId = req.params.id;
  const challenge = await findChallenge(challengeId);
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  if (!(await checkChallengeLock(req, res, challenge))) {
    return;
  }

  const user = await getOrCreateSessionUser(req);
  let session = null;
  if (user) {
    session = await ParticipantSession.findOne({
      userId: user._id,
      challengeId: challenge._id,
    });
  }

  if (!session) {
    return res.json({
      success: true,
      hasSession: false,
      challenge: {
        id: challenge._id,
        title: challenge.title,
        slug: challenge.slug,
        description: challenge.description,
        difficulty: challenge.difficulty,
        points: challenge.points,
        category: challenge.category,
        timeLimitSeconds: challenge.timeLimitSeconds,
        sampleInput: challenge.sampleInput,
        sampleOutput: challenge.sampleOutput,
        supportedLanguages: (challenge.languageConfigs || []).map((lc) => ({
          id: lc.language,
          name: lc.languageName || lc.language,
          blockCount: lc.blocks?.length || 0,
        })),
        totalTasks: (challenge.tasks || []).length,
      },
    });
  }

  const language = session.selectedLanguage;
  const sortedTasks = getTasksForLanguage(challenge, language);
  const allDone = session.currentTaskIndex >= sortedTasks.length;

  // Current task
  const currentTask = allDone ? null : sortedTasks[session.currentTaskIndex];
  const quizIdx = session.currentQuizIndex || 0;

  // Cooldown
  const taskAttempt = currentTask
    ? session.taskAttempts.find((ta) => ta.taskId === currentTask.taskId)
    : null;
  let cooldownRemaining = 0;
  if (taskAttempt?.cooldownUntil) {
    cooldownRemaining = Math.max(0, Math.ceil((new Date(taskAttempt.cooldownUntil) - Date.now()) / 1000));
  }

  res.json({
    success: true,
    hasSession: true,
    session: {
      sessionId: session._id,
      challengeId: challenge._id,
      language,
      startTime: session.startTime,
      durationSeconds: session.durationSeconds || challenge.timeLimitSeconds || 1200,
      completedTaskIds: session.completedTaskIds,
      currentTaskIndex: session.currentTaskIndex,
      totalTasks: sortedTasks.length,
      totalPenaltySeconds: session.totalPenaltySeconds || 0,
      wrongAttemptsCount: session.wrongAttemptsCount || 0,
      status: session.status,
    },
    currentTask: sanitiseTask(currentTask, quizIdx),
    allTasksCompleted: allDone,
    cooldownRemaining,
    unlockedBlocks: buildUnlockedBlocks(challenge, session, language),
    challenge: {
      id: challenge._id,
      title: challenge.title,
      slug: challenge.slug,
      description: challenge.description,
      difficulty: challenge.difficulty,
      points: challenge.points,
      category: challenge.category,
      timeLimitSeconds: challenge.timeLimitSeconds,
      sampleInput: challenge.sampleInput,
      sampleOutput: challenge.sampleOutput,
      supportedLanguages: (challenge.languageConfigs || []).map((lc) => ({
        id: lc.language,
        name: lc.languageName || lc.language,
        blockCount: lc.blocks?.length || 0,
      })),
      totalTasks: sortedTasks.length,
    },
  });
});

// ── HELPER: Build unlocked blocks for response ────────────────────────────

function buildUnlockedBlocks(challenge, session, language) {
  if (!session || !language) return [];
  const langConfig = getLangConfig(challenge, language);
  if (!langConfig) return [];

  const revealedIds = session.revealedBlockIds || [];
  return revealedIds
    .map((blockId) => {
      const block = getBlockData(langConfig, blockId);
      if (!block) return null;
      return {
        blockId: block.blockId,
        code: block.code,
        role: block.role,
        language,
      };
    })
    .filter(Boolean);
}
