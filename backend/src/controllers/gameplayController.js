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
 * Dynamically prefixes title as "Task {displayIndex + 1}: {cleanTitle}"
 */
function sanitiseTask(task, quizIdx = 0, displayIndex = null) {
  if (!task) return null;
  const pool = task.quizPool || [];
  if (pool.length === 0) return null;
  const quiz = pool[quizIdx % pool.length];

  let rawTitle = task.title || '';
  // Strip hardcoded "Task 1:", "Task 2 -", "Task 03:", etc. from beginning
  const cleanTitle = rawTitle.replace(/^Task\s*\d+\s*[:\-]\s*/i, '').trim();

  let finalTitle = rawTitle;
  let finalOrder = task.order;

  if (displayIndex !== null && displayIndex !== undefined) {
    const num = displayIndex + 1;
    finalTitle = cleanTitle ? `Task ${num}: ${cleanTitle}` : `Task ${num}`;
    finalOrder = num;
  }

  return {
    taskId: task.taskId,
    title: finalTitle,
    description: task.description || '',
    order: finalOrder,
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
  const norm = (language || '').toLowerCase().trim();
  return challenge.languageConfigs.find((lc) => (lc.language || '').toLowerCase().trim() === norm) || challenge.languageConfigs[0] || null;
}

/**
 * Get reward blockId for a task in a given language
 */
function getRewardBlockId(task, language) {
  if (!task.rewards) return null;
  const norm = (language || '').toLowerCase().trim();
  if (typeof task.rewards.get === 'function') {
    return task.rewards.get(norm) || task.rewards.get(language) || null;
  }
  return task.rewards[norm] || task.rewards[language] || null;
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
  const normLang = (language || '').toLowerCase().trim();
  const filtered = challenge.tasks.filter((task) => {
    if (!task.rewards) return true;
    let reward = null;
    if (typeof task.rewards.get === 'function') {
      reward = task.rewards.get(normLang) || task.rewards.get(language);
    } else {
      reward = task.rewards[normLang] || task.rewards[language];
    }
    return Boolean(reward);
  });
  const list = filtered.length > 0 ? filtered : challenge.tasks;
  return [...list].sort((a, b) => a.order - b.order);
}

/**
 * Fisher-Yates array shuffle
 */
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a shuffled sequence of task IDs, guaranteed not identical to canonical order if length > 1
 */
function getShuffledTaskOrder(baseTasks) {
  if (!baseTasks || baseTasks.length <= 1) {
    return (baseTasks || []).map((t) => t.taskId);
  }
  const baseIds = baseTasks.map((t) => t.taskId);
  let shuffled = shuffleArray(baseIds);
  let attempts = 0;
  while (attempts < 10 && shuffled.every((id, idx) => id === baseIds[idx])) {
    shuffled = shuffleArray(baseIds);
    attempts++;
  }
  if (shuffled.every((id, idx) => id === baseIds[idx]) && shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

/**
 * Get ordered tasks for a participant session.
 * Preserves existing session.taskOrder if valid, or generates and saves a new shuffled order.
 */
async function getSessionOrderedTasks(challenge, session, language) {
  const baseTasks = getTasksForLanguage(challenge, language);
  if (!baseTasks || baseTasks.length === 0) return [];
  if (baseTasks.length === 1) return baseTasks;

  const taskMap = new Map(baseTasks.map((t) => [t.taskId, t]));
  const baseTaskIds = baseTasks.map((t) => t.taskId);

  // Check if session already has a valid taskOrder containing all base task IDs
  const existingOrder = session?.taskOrder;
  const isValid =
    Array.isArray(existingOrder) &&
    existingOrder.length === baseTasks.length &&
    existingOrder.every((id) => taskMap.has(id));

  if (isValid) {
    return existingOrder.map((id) => taskMap.get(id)).filter(Boolean);
  }

  // If session already had some completed tasks, preserve completed ones first, shuffle remaining
  if (Array.isArray(session?.completedTaskIds) && session.completedTaskIds.length > 0) {
    const completedSet = new Set(session.completedTaskIds);
    const completedList = baseTaskIds.filter((id) => completedSet.has(id));
    const remainingList = baseTaskIds.filter((id) => !completedSet.has(id));
    const shuffledRemaining = shuffleArray(remainingList);
    const combined = [...completedList, ...shuffledRemaining];
    if (session) {
      session.taskOrder = combined;
      await session.save();
    }
    return combined.map((id) => taskMap.get(id)).filter(Boolean);
  }

  // Generate new shuffled task order
  const shuffledIds = getShuffledTaskOrder(baseTasks);
  if (session) {
    session.taskOrder = shuffledIds;
    await session.save();
  }

  return shuffledIds.map((id) => taskMap.get(id)).filter(Boolean);
}

/**
 * Computes current live points breakdown for a session.
 * - Initial points: 0.
 * - Wrong task answers: -20 pts each (taskPenaltyPoints).
 * - Runs after 3 free runs: -10 pts each (runPenaltyPoints).
 * - Exhausted minutes: -10 pts per 1 min (timePenaltyPoints).
 * - Total penalty = taskPenaltyPoints + runPenaltyPoints + timePenaltyPoints.
 * - Current score = -totalPenalty.
 */
function computeSessionPoints(session) {
  if (!session) {
    return {
      currentScore: 0,
      totalPenaltyPoints: 0,
      taskPenaltyPoints: 0,
      runPenaltyPoints: 0,
      timePenaltyPoints: 0,
      runCount: 0,
      runsRemainingFree: 3,
      timeMinutesExhausted: 0,
    };
  }

  const start = session.startTime ? new Date(session.startTime) : new Date();
  const end = session.endTime ? new Date(session.endTime) : new Date();
  const elapsedSec = Math.max(0, Math.floor((end - start) / 1000));
  const timeMinutesExhausted = Math.floor(elapsedSec / 60);
  const timePenaltyPoints = timeMinutesExhausted * 10;

  const taskPenaltyPoints = session.taskPenaltyPoints || 0;
  const runPenaltyPoints = session.runPenaltyPoints || 0;
  const runCount = session.runCount || 0;
  const runsRemainingFree = Math.max(0, 3 - runCount);

  const totalPenaltyPoints = taskPenaltyPoints + runPenaltyPoints + timePenaltyPoints;
  const currentScore = -totalPenaltyPoints;

  return {
    currentScore,
    totalPenaltyPoints,
    taskPenaltyPoints,
    runPenaltyPoints,
    timePenaltyPoints,
    runCount,
    runsRemainingFree,
    timeMinutesExhausted,
  };
}

/**
 * Computes live points for this session PLUS cumulative history from previous challenges.
 */
async function computeSessionPointsWithHistory(session) {
  const base = computeSessionPoints(session);
  if (!session || !session.userId) {
    return {
      ...base,
      previousChallengesPenalty: 0,
      overallTotalPenaltyPoints: base.totalPenaltyPoints,
      overallScore: base.currentScore,
    };
  }

  const otherSessions = await ParticipantSession.find({
    userId: session.userId,
    _id: { $ne: session._id },
  }).lean();

  let previousChallengesPenalty = 0;
  for (const s of otherSessions) {
    previousChallengesPenalty += (s.totalPenaltyPoints || 0);
  }

  const overallTotalPenaltyPoints = previousChallengesPenalty + base.totalPenaltyPoints;
  const overallScore = -overallTotalPenaltyPoints;

  return {
    ...base,
    previousChallengesPenalty,
    overallTotalPenaltyPoints,
    overallScore,
  };
}

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

  const durationLimit = challenge.timeLimitSeconds || 900;

  // Base tasks for selected language
  const baseTasks = getTasksForLanguage(challenge, language);
  const newShuffledTaskOrder = getShuffledTaskOrder(baseTasks);

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
    session.taskOrder = newShuffledTaskOrder;
    session.currentTaskIndex = 0;
    session.currentQuizIndex = 0;
    session.taskAttempts = [];
    session.scannedBlocks = [];
    session.assemblyOrder = [];
    session.assembledCode = '';
    session.revealedBlockIds = [];
    session.revealsCount = 0;
    session.revealEvents = [];
    session.durationSeconds = durationLimit;
    session.taskPenaltyPoints = 0;
    session.runCount = 0;
    session.runPenaltyPoints = 0;
    session.timePenaltyPoints = 0;
    session.totalPenaltyPoints = 0;
    session.currentScore = 0;
    session.totalPenaltySeconds = 0;
    session.wrongAttemptsCount = 0;
    session.startedAt = new Date();
    session.startTime = new Date();
    session.lastActivityAt = new Date();
    session.completedAt = null;
    await session.save();
  } else if (session) {
    // Resume existing session – update language if not locked
    if (session.completedTaskIds.length === 0) {
      session.selectedLanguage = language;
    }
    const taskMap = new Map(baseTasks.map((t) => [t.taskId, t]));
    if (!Array.isArray(session.taskOrder) || session.taskOrder.length !== baseTasks.length || !session.taskOrder.every((id) => taskMap.has(id))) {
      session.taskOrder = newShuffledTaskOrder;
    }
    session.durationSeconds = durationLimit;
    session.lastActivityAt = new Date();
    await session.save();
  } else if (user) {
    // Create new session
    session = await ParticipantSession.create({
      userId: user._id,
      challengeId: challenge._id,
      selectedLanguage: language,
      completedTaskIds: [],
      taskOrder: newShuffledTaskOrder,
      currentTaskIndex: 0,
      currentQuizIndex: 0,
      taskAttempts: [],
      scannedBlocks: [],
      assemblyOrder: [],
      assembledCode: '',
      revealedBlockIds: [],
      revealsCount: 0,
      revealEvents: [],
      durationSeconds: durationLimit,
      taskPenaltyPoints: 0,
      runCount: 0,
      runPenaltyPoints: 0,
      timePenaltyPoints: 0,
      totalPenaltyPoints: 0,
      currentScore: 0,
      totalPenaltySeconds: 0,
    });
  }

  const orderedTasks = await getSessionOrderedTasks(challenge, session, language);

  // Build response: first task (sanitised), no blocks yet
  const currentTaskIdx = session?.currentTaskIndex || 0;
  const currentTask = orderedTasks[currentTaskIdx];
  const quizIdx = session?.currentQuizIndex || 0;
  const pointsInfo = await computeSessionPointsWithHistory(session);

  res.json({
    success: true,
    session: {
      sessionId: session?._id || null,
      challengeId: challenge._id,
      language,
      startTime: session?.startTime || Date.now(),
      durationSeconds: durationLimit,
      completedTaskIds: session?.completedTaskIds || [],
      currentTaskIndex: currentTaskIdx,
      totalTasks: orderedTasks.length,
      totalPenaltySeconds: session?.totalPenaltySeconds || 0,
      points: pointsInfo,
      currentScore: pointsInfo.currentScore,
      unlockedBlocks: buildUnlockedBlocks(challenge, session, language),
      status: session?.status || 'ACTIVE',
    },
    currentTask: sanitiseTask(currentTask, quizIdx, currentTaskIdx),
    totalTasks: orderedTasks.length,
    points: pointsInfo,
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

  const orderedTasks = await getSessionOrderedTasks(challenge, session, session.selectedLanguage);

  // Check if all tasks completed
  const allTasksFinished = (session.completedTaskIds || []).length >= orderedTasks.length;
  if (allTasksFinished) {
    const langConfig = getLangConfig(challenge, session.selectedLanguage);
    let dirty = false;
    if (langConfig) {
      for (const t of orderedTasks) {
        const rId = getRewardBlockId(t, session.selectedLanguage);
        if (rId) {
          if (!session.revealedBlockIds.includes(rId)) {
            session.revealedBlockIds.push(rId);
            dirty = true;
          }
          const bData = getBlockData(langConfig, rId);
          if (bData) {
            if (!session.scannedBlocks) session.scannedBlocks = [];
            const exists = session.scannedBlocks.some((b) => (b.blockId || b._id) === bData.blockId);
            if (!exists) {
              session.scannedBlocks.push({
                blockId: bData.blockId,
                code: bData.code,
                role: bData.role,
                language: session.selectedLanguage,
              });
              dirty = true;
            }
          }
        }
      }
    }
    if (dirty) {
      await session.save();
    }

    const pointsInfo = await computeSessionPointsWithHistory(session);
    return res.json({
      success: true,
      allTasksCompleted: true,
      currentTask: null,
      completedTaskIds: session.completedTaskIds,
      totalTasks: orderedTasks.length,
      unlockedBlocks: buildUnlockedBlocks(challenge, session, session.selectedLanguage),
      points: pointsInfo,
      currentScore: pointsInfo.currentScore,
    });
  }

  const currentTask = orderedTasks[session.currentTaskIndex];
  const quizIdx = session.currentQuizIndex || 0;

  // Check if there's a cooldown active
  const taskAttempt = session.taskAttempts.find((ta) => ta.taskId === currentTask.taskId);
  let cooldownRemaining = 0;
  if (taskAttempt?.cooldownUntil) {
    cooldownRemaining = Math.max(0, Math.ceil((new Date(taskAttempt.cooldownUntil) - Date.now()) / 1000));
  }

  const pointsInfo = await computeSessionPointsWithHistory(session);
  const attemptsCount = taskAttempt?.wrongAnswers || 0;

  res.json({
    success: true,
    allTasksCompleted: false,
    currentTask: sanitiseTask(currentTask, quizIdx, session.currentTaskIndex),
    currentTaskIndex: session.currentTaskIndex,
    completedTaskIds: session.completedTaskIds,
    totalTasks: orderedTasks.length,
    totalPenaltySeconds: session.totalPenaltySeconds || 0,
    cooldownRemaining,
    unlockedBlocks: buildUnlockedBlocks(challenge, session, session.selectedLanguage),
    points: pointsInfo,
    currentScore: pointsInfo.currentScore,
    attemptsCount,
    maxAttempts: 3,
    attemptsRemaining: Math.max(0, 3 - attemptsCount),
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

  const orderedTasks = await getSessionOrderedTasks(challenge, session, session.selectedLanguage);

  if (session.currentTaskIndex >= orderedTasks.length) {
    return res.status(400).json({ success: false, message: 'All tasks already completed' });
  }

  const currentTask = orderedTasks[session.currentTaskIndex];
  const language = session.selectedLanguage;
  const quizIdx = session.currentQuizIndex || 0;
  const pool = currentTask.quizPool || [];
  if (pool.length === 0) {
    return res.status(500).json({ success: false, message: 'Task has no quiz questions' });
  }

  const quiz = pool[quizIdx % pool.length];

  // ── Task attempt tracking (penalties are applied instead of cooldown lockout) ──
  let taskAttempt = session.taskAttempts.find((ta) => ta.taskId === currentTask.taskId);
  if (taskAttempt && taskAttempt.cooldownUntil) {
    taskAttempt.cooldownUntil = null;
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
    if (!session.completedTaskIds.includes(currentTask.taskId)) {
      session.completedTaskIds.push(currentTask.taskId);
    }

    // Unlock the reward block
    const rewardBlockId = getRewardBlockId(currentTask, language);
    let unlockedBlock = null;

    if (rewardBlockId) {
      const langConfig = getLangConfig(challenge, language);
      const blockData = getBlockData(langConfig, rewardBlockId);
      if (blockData) {
        if (!session.revealedBlockIds.includes(rewardBlockId)) {
          session.revealedBlockIds.push(rewardBlockId);
          session.revealsCount += 1;
          session.revealEvents.push({
            taskId: currentTask.taskId,
            blockId: rewardBlockId,
            penalty: 0,
            timestamp: new Date(),
          });
        }
        unlockedBlock = {
          blockId: blockData.blockId,
          code: blockData.code,
          role: blockData.role,
          language,
        };
        // Also keep session.scannedBlocks synced for assembly/judging validation
        if (!session.scannedBlocks) session.scannedBlocks = [];
        const alreadyScanned = session.scannedBlocks.some((b) => (b.blockId || b._id) === blockData.blockId);
        if (!alreadyScanned) {
          session.scannedBlocks.push(unlockedBlock);
        }
      }
    }

    // Advance to next task index based on number of completed tasks
    session.currentTaskIndex = session.completedTaskIds.length;
    session.currentQuizIndex = 0;

    // Check if all tasks done
    const allDone = session.completedTaskIds.length >= orderedTasks.length;

    // Guarantee ALL task reward blocks are revealed and scanned when all tasks are complete
    if (allDone) {
      const langConfig = getLangConfig(challenge, language);
      if (langConfig) {
        for (const t of orderedTasks) {
          const rId = getRewardBlockId(t, language);
          if (rId) {
            if (!session.revealedBlockIds.includes(rId)) {
              session.revealedBlockIds.push(rId);
            }
            const bData = getBlockData(langConfig, rId);
            if (bData) {
              if (!session.scannedBlocks) session.scannedBlocks = [];
              const exists = session.scannedBlocks.some((b) => (b.blockId || b._id) === bData.blockId);
              if (!exists) {
                session.scannedBlocks.push({
                  blockId: bData.blockId,
                  code: bData.code,
                  role: bData.role,
                  language,
                });
              }
            }
          }
        }
      }
    }

    const pointsInfo = await computeSessionPointsWithHistory(session);
    session.totalPenaltyPoints = pointsInfo.totalPenaltyPoints;
    session.currentScore = pointsInfo.currentScore;
    session.lastActivityAt = new Date();
    await session.save();

    // Build next task
    const nextTask = allDone ? null : orderedTasks[session.currentTaskIndex];

    return res.json({
      success: true,
      correct: true,
      explain: quiz.explain || '',
      unlockedBlock,
      allTasksCompleted: allDone,
      nextTask: sanitiseTask(nextTask, 0, session.currentTaskIndex),
      currentTaskIndex: session.currentTaskIndex,
      completedTaskIds: session.completedTaskIds,
      totalTasks: orderedTasks.length,
      totalPenaltySeconds: session.totalPenaltySeconds || 0,
      points: pointsInfo,
      currentScore: pointsInfo.currentScore,
      unlockedBlocks: buildUnlockedBlocks(challenge, session, language),
    });
  } else {
    // ── WRONG ANSWER ──
    // In tasks in MCQ if one time ans is wrong give -20 pts for fill in the blanks provide -20 pts for wrong
    // after 3 wrong attempts reveal an answer and unlock fragment
    const penalty = 20;

    taskAttempt.wrongAnswers = (taskAttempt.wrongAnswers || 0) + 1;
    taskAttempt.penaltySeconds = (taskAttempt.penaltySeconds || 0) + penalty;
    taskAttempt.cooldownUntil = null; // No cooldown lockout

    session.taskPenaltyPoints = (session.taskPenaltyPoints || 0) + penalty;
    session.totalPenaltySeconds = (session.totalPenaltySeconds || 0) + penalty;
    session.wrongAttemptsCount = (session.wrongAttemptsCount || 0) + 1;

    // Check if 3 wrong attempts reached -> reveal answer & unlock fragment
    if (taskAttempt.wrongAnswers >= 3) {
      taskAttempt.answerRevealed = true;
      taskAttempt.completedAt = new Date();
      if (!session.completedTaskIds.includes(currentTask.taskId)) {
        session.completedTaskIds.push(currentTask.taskId);
      }

      // Unlock the reward block so participant is not stuck
      const rewardBlockId = getRewardBlockId(currentTask, language);
      let unlockedBlock = null;

      if (rewardBlockId) {
        const langConfig = getLangConfig(challenge, language);
        const blockData = getBlockData(langConfig, rewardBlockId);
        if (blockData) {
          if (!session.revealedBlockIds.includes(rewardBlockId)) {
            session.revealedBlockIds.push(rewardBlockId);
            session.revealsCount += 1;
            session.revealEvents.push({
              taskId: currentTask.taskId,
              blockId: rewardBlockId,
              penalty: 0,
              timestamp: new Date(),
            });
          }
          unlockedBlock = {
            blockId: blockData.blockId,
            code: blockData.code,
            role: blockData.role,
            language,
          };
          if (!session.scannedBlocks) session.scannedBlocks = [];
          const alreadyScanned = session.scannedBlocks.some((b) => (b.blockId || b._id) === blockData.blockId);
          if (!alreadyScanned) {
            session.scannedBlocks.push(unlockedBlock);
          }
        }
      }

      // Format readable revealed answer
      let revealedAnswer = '';
      if (quiz.type === 'MCQ') {
        const opt = quiz.options?.[Number(quiz.answer)];
        revealedAnswer = opt !== undefined ? `${opt}` : String(quiz.answer);
      } else if (quiz.type === 'FILL_BLANK') {
        revealedAnswer = Array.isArray(quiz.answer) ? quiz.answer.join(' / ') : String(quiz.answer);
      } else if (quiz.type === 'CODE_ORDER') {
        revealedAnswer = Array.isArray(quiz.answer) ? quiz.answer.join(' -> ') : String(quiz.answer);
      } else {
        revealedAnswer = String(quiz.answer || '');
      }

      // Advance to next task index based on number of completed tasks
      session.currentTaskIndex = session.completedTaskIds.length;
      session.currentQuizIndex = 0;

      const allDone = session.completedTaskIds.length >= orderedTasks.length;

      // Guarantee ALL task reward blocks are revealed and scanned when all tasks are complete
      if (allDone) {
        const langConfig = getLangConfig(challenge, language);
        if (langConfig) {
          for (const t of orderedTasks) {
            const rId = getRewardBlockId(t, language);
            if (rId) {
              if (!session.revealedBlockIds.includes(rId)) {
                session.revealedBlockIds.push(rId);
              }
              const bData = getBlockData(langConfig, rId);
              if (bData) {
                if (!session.scannedBlocks) session.scannedBlocks = [];
                const exists = session.scannedBlocks.some((b) => (b.blockId || b._id) === bData.blockId);
                if (!exists) {
                  session.scannedBlocks.push({
                    blockId: bData.blockId,
                    code: bData.code,
                    role: bData.role,
                    language,
                  });
                }
              }
            }
          }
        }
      }

      const nextTask = allDone ? null : orderedTasks[session.currentTaskIndex];

      const pointsInfo = await computeSessionPointsWithHistory(session);
      session.totalPenaltyPoints = pointsInfo.totalPenaltyPoints;
      session.currentScore = pointsInfo.currentScore;
      session.lastActivityAt = new Date();
      await session.save();

      return res.json({
        success: true,
        correct: false,
        answerRevealed: true,
        revealedAnswer,
        explain: quiz.explain || '',
        penalty,
        attemptsCount: taskAttempt.wrongAnswers,
        maxAttempts: 3,
        attemptsRemaining: 0,
        unlockedBlock,
        allTasksCompleted: allDone,
        nextTask: sanitiseTask(nextTask, 0, session.currentTaskIndex),
        currentTaskIndex: session.currentTaskIndex,
        completedTaskIds: session.completedTaskIds,
        totalTasks: orderedTasks.length,
        points: pointsInfo,
        currentScore: pointsInfo.currentScore,
        unlockedBlocks: buildUnlockedBlocks(challenge, session, language),
        message: '3 attempts exhausted. Correct answer revealed and code block unlocked!',
      });
    }

    // Wrong answer with attempts remaining (< 3)
    const pointsInfo = await computeSessionPointsWithHistory(session);
    session.totalPenaltyPoints = pointsInfo.totalPenaltyPoints;
    session.currentScore = pointsInfo.currentScore;
    session.lastActivityAt = new Date();
    await session.save();

    return res.json({
      success: true,
      correct: false,
      answerRevealed: false,
      attemptsCount: taskAttempt.wrongAnswers,
      maxAttempts: 3,
      attemptsRemaining: Math.max(0, 3 - taskAttempt.wrongAnswers),
      penalty,
      explain: quiz.explain || 'Incorrect answer. Try again!',
      points: pointsInfo,
      currentScore: pointsInfo.currentScore,
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
  const orderedTasks = await getSessionOrderedTasks(challenge, session, language);
  const allDone = session.currentTaskIndex >= orderedTasks.length;

  // Current task
  const currentTask = allDone ? null : orderedTasks[session.currentTaskIndex];
  const quizIdx = session.currentQuizIndex || 0;

  // Cooldown
  const taskAttempt = currentTask
    ? session.taskAttempts.find((ta) => ta.taskId === currentTask.taskId)
    : null;
  let cooldownRemaining = 0;
  if (taskAttempt?.cooldownUntil) {
    cooldownRemaining = Math.max(0, Math.ceil((new Date(taskAttempt.cooldownUntil) - Date.now()) / 1000));
  }

  const pointsInfo = await computeSessionPointsWithHistory(session);
  const attemptsCount = taskAttempt?.wrongAnswers || 0;

  res.json({
    success: true,
    hasSession: true,
    session: {
      sessionId: session._id,
      challengeId: challenge._id,
      language,
      startTime: session.startTime,
      durationSeconds: session.durationSeconds || challenge.timeLimitSeconds || 900,
      completedTaskIds: session.completedTaskIds,
      currentTaskIndex: session.currentTaskIndex,
      totalTasks: orderedTasks.length,
      totalPenaltySeconds: session.totalPenaltySeconds || 0,
      wrongAttemptsCount: session.wrongAttemptsCount || 0,
      points: pointsInfo,
      currentScore: pointsInfo.currentScore,
      status: session.status,
    },
    currentTask: sanitiseTask(currentTask, quizIdx, session.currentTaskIndex),
    allTasksCompleted: allDone,
    cooldownRemaining,
    unlockedBlocks: buildUnlockedBlocks(challenge, session, language),
    points: pointsInfo,
    currentScore: pointsInfo.currentScore,
    attemptsCount,
    maxAttempts: 3,
    attemptsRemaining: Math.max(0, 3 - attemptsCount),
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
      totalTasks: orderedTasks.length,
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
