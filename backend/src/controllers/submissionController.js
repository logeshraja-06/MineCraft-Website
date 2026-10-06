const asyncHandler = require('../utils/asyncHandler');
const Submission = require('../models/Submission');
const TestCase = require('../models/TestCase');
const Challenge = require('../models/Challenge');
const ParticipantSession = require('../models/ParticipantSession');
const { runSingleTestCase } = require('../services/judging/testRunner');
const { evaluateAllTestCases } = require('../services/judging/judgingService');
const { calculateSubmissionScore } = require('../services/judging/scoringService');
const { getLanguageId, isSupportedLanguage } = require('../utils/languageMap');
const { executeCode } = require('../services/judge0Service');
const { getHiddenTests } = require('../config/challenges');

const { checkIfSessionExpired } = require('../services/session/timerService');
const { checkChallengeLock } = require('../services/challenge/progressionService');

/**
 * Normalizes output string for comparison
 */
function normalizeOutput(str = '') {
  return String(str || '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function normalizeCode(str = '') {
  return String(str || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function getAssembledCodeFromSession(session) {
  if (!session) return null;
  if (session.assembledCode && session.assembledCode.trim()) {
    return session.assembledCode;
  }
  if (!session.assemblyOrder || !session.assemblyOrder.length) {
    return null;
  }
  const blockMap = new Map();
  (session.scannedBlocks || []).forEach((b) => {
    const bId = String(b.blockId || b._id);
    blockMap.set(bId, b.code || b.codeSnippet || '');
  });
  const parts = session.assemblyOrder
    .map((id) => blockMap.get(String(id)))
    .filter((code) => code !== undefined && code !== null);
  if (parts.length === 0) return null;
  return parts.join('\n\n');
}

/**
 * Handles "Run Code" visible / sample execution
 * POST /api/submissions/run
 */
exports.runCode = asyncHandler(async (req, res) => {
  const language = req.body?.language;
  const sourceCode = req.body?.sourceCode !== undefined ? req.body.sourceCode : req.body?.code;
  const stdin = req.body?.stdin !== undefined ? req.body.stdin : (req.body?.input !== undefined ? req.body.input : '');
  const challengeId = req.body?.challengeId;

  if (challengeId) {
    const isUnlocked = await checkChallengeLock(req, res, challengeId);
    if (!isUnlocked) return;
  }

  if (!language || typeof language !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Language is required',
    });
  }

  if (!isSupportedLanguage(language)) {
    return res.status(400).json({
      success: false,
      message: `Unsupported language: '${language}'. Supported languages: c, cpp, java, python`,
    });
  }

  if (!sourceCode || typeof sourceCode !== 'string' || !sourceCode.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Source code cannot be empty',
    });
  }

  // New points system: first 3 runs are free; after 3 runs, each run gets -10 pts
  let runInfo = {
    runCount: 0,
    runsRemainingFree: 3,
    runPenaltyApplied: 0,
    runPenaltyPoints: 0,
    taskPenaltyPoints: 0,
    timePenaltyPoints: 0,
    totalPenaltyPoints: 0,
    currentScore: 0,
  };

  // If challengeId is provided, enforce session active/expiry check
  if (challengeId && req.user) {
    let challenge = null;
    if (/^[0-9a-fA-F]{24}$/.test(challengeId)) {
      challenge = await Challenge.findById(challengeId);
    }
    if (!challenge) {
      challenge = await Challenge.findOne({
        $or: [{ slug: challengeId }, { slug: String(challengeId).toLowerCase() }],
      });
    }
    const targetChallengeId = challenge ? challenge._id : challengeId;

    const session = await ParticipantSession.findOne({
      userId: req.user._id,
      challengeId: targetChallengeId,
      isCompleted: false,
    });

    if (session && checkIfSessionExpired(session.startTime, session.durationSeconds)) {
      session.status = 'EXPIRED';
      session.isCompleted = true;
      session.endTime = new Date();
      await session.save();
      return res.status(403).json({
        success: false,
        message: 'Your challenge session has expired. Running code is disabled.',
        isExpired: true,
      });
    }

    if (session) {
      session.runCount = (session.runCount || 0) + 1;
      let penaltyApplied = 0;
      if (session.runCount > 3) {
        penaltyApplied = 10;
        session.runPenaltyPoints = (session.runPenaltyPoints || 0) + 10;
      }
      const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(session.startTime)) / 1000));
      session.timePenaltyPoints = Math.floor(elapsedSec / 60) * 10;
      session.totalPenaltyPoints = (session.taskPenaltyPoints || 0) + session.runPenaltyPoints + session.timePenaltyPoints;
      session.currentScore = -session.totalPenaltyPoints;
      session.lastActivityAt = new Date();
      await session.save();

      let previousChallengesPenalty = 0;
      if (req.user) {
        const otherSessions = await ParticipantSession.find({
          userId: req.user._id,
          challengeId: { $ne: targetChallengeId },
        }).lean();
        for (const s of otherSessions) {
          previousChallengesPenalty += (s.totalPenaltyPoints || 0);
        }
      }
      const overallTotalPenaltyPoints = previousChallengesPenalty + session.totalPenaltyPoints;
      const overallScore = -overallTotalPenaltyPoints;

      runInfo = {
        runCount: session.runCount,
        runsRemainingFree: Math.max(0, 3 - session.runCount),
        runPenaltyApplied: penaltyApplied,
        runPenaltyPoints: session.runPenaltyPoints,
        taskPenaltyPoints: session.taskPenaltyPoints || 0,
        timePenaltyPoints: session.timePenaltyPoints,
        totalPenaltyPoints: session.totalPenaltyPoints,
        currentScore: session.currentScore,
        previousChallengesPenalty,
        overallTotalPenaltyPoints,
        overallScore,
      };
    }
  }

  try {
    // Attempt execution via testRunner / Judge0
    const outcome = await runSingleTestCase({
      sourceCode: sourceCode.trim(),
      language,
      input: typeof stdin === 'string' ? stdin : String(stdin || ''),
      expectedOutput: '',
    });

    const isAccepted = (outcome.status === 'ACCEPTED' || outcome.status === 'Accepted') && Boolean(outcome.passed);

    return res.status(200).json({
      success: isAccepted,
      status: outcome.status || (isAccepted ? 'Accepted' : 'Error'),
      stdout: outcome.stdout || '',
      stderr: outcome.stderr || '',
      compileOutput: outcome.compileOutput || '',
      output: outcome.stdout || outcome.stderr || outcome.compileOutput || '',
      message: isAccepted
        ? 'Execution completed successfully.'
        : (outcome.stderr || outcome.compileOutput || 'Execution finished with output.'),
      executionTime: outcome.time || '0.04s',
      memory: outcome.memory || 0,
      time: outcome.time || '0.04s',
      ...(runInfo || {}),
    });
  } catch (error) {
    console.error('[SubmissionController.runCode] Error:', error.message);
    return res.status(500).json({
      success: false,
      status: 'Internal Error',
      stdout: '',
      stderr: 'Unable to execute code via execution sandbox. Please try again.',
      compileOutput: '',
      message: error.message || 'Execution service error',
      time: '0.00s',
      memory: 0,
    });
  }
});

/**
 * Handles official challenge submission and evaluates against hidden test cases
 * POST /api/submissions/submit
 */
exports.submitSolution = asyncHandler(async (req, res) => {
  const language = req.body?.language;
  let sourceCode = req.body?.sourceCode !== undefined ? req.body.sourceCode : req.body?.code;
  const challengeId = req.body?.challengeId || 'ch-05';
  const assembledBlockIds = req.body?.assembledBlockIds || req.body?.blocksUsed || [];
  const isAutoSubmit = Boolean(req.body?.isAutoSubmit);

  if (!language || !isSupportedLanguage(language)) {
    return res.status(400).json({
      success: false,
      message: `Valid language (c, cpp, java, python) is required`,
    });
  }

  if (!isAutoSubmit && (!sourceCode || !sourceCode.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Source code cannot be empty',
    });
  }

  // 1. Look up challenge from MongoDB if valid ObjectId or fallback
  let challenge = null;
  if (/^[0-9a-fA-F]{24}$/.test(challengeId)) {
    challenge = await Challenge.findById(challengeId);
  }
  if (!challenge) {
    challenge = await Challenge.findOne({
      $or: [
        { slug: challengeId },
        { slug: String(challengeId).toLowerCase() },
      ],
    });
  }

  const targetChallengeId = challenge ? challenge._id : challengeId;

  // Enforce sequential tier progression
  const isProgressionUnlocked = await checkChallengeLock(req, res, challenge || challengeId);
  if (!isProgressionUnlocked) return;

  // 2. Fetch participant session and enforce session checks
  let session = null;
  if (req.user && targetChallengeId) {
    try {
      session = await ParticipantSession.findOne({
        userId: req.user._id,
        challengeId: targetChallengeId,
      });

      if (session && checkIfSessionExpired(session.startTime, session.durationSeconds)) {
        if (!isAutoSubmit) {
          session.status = 'EXPIRED';
          session.isCompleted = true;
          session.endTime = new Date();
          await session.save();
          return res.status(403).json({
            success: false,
            message: 'Your challenge session has expired. Submissions are disabled.',
            isExpired: true,
          });
        }
      }

      // If auto-submitting and sourceCode is empty, fallback to session's assembledCode
      if (isAutoSubmit && (!sourceCode || !sourceCode.trim()) && session?.assembledCode?.trim()) {
        sourceCode = session.assembledCode;
      }

      // Server-side check that submitted code matches assembled blocks in saved order
      if (session && (session.assemblyOrder?.length > 0 || (session.assembledCode && session.assembledCode.trim()))) {
        const expectedCode = getAssembledCodeFromSession(session);
        if (expectedCode && normalizeCode(sourceCode || '') !== normalizeCode(expectedCode)) {
          if (!isAutoSubmit) {
            return res.status(400).json({
              success: false,
              message: 'Submitted code does not match your assembled session blocks.',
            });
          }
        }
      }
    } catch (sessionErr) {
      console.warn('[SubmissionController.submitSolution] Session check warning:', sessionErr.message);
    }
  }

  // 3. Fetch test cases from MongoDB or fallback to static hidden tests
  let testCases = [];
  if (challenge && challenge._id) {
    testCases = await TestCase.find({ challengeId: challenge._id, isEnabled: true });
  }

  // Fallback to static config if no MongoDB test cases exist
  if (!testCases || testCases.length === 0) {
    const staticTests = getHiddenTests(challengeId);
    testCases = staticTests.map((t) => ({
      _id: t.id,
      input: t.input,
      expectedOutput: t.expectedOutput,
      isHidden: true,
      points: 20,
    }));
  }

  // 4. Evaluate test cases (if empty code on auto-submit, treat as failed)
  let evalResult;
  if (!sourceCode || !sourceCode.trim()) {
    evalResult = {
      overallStatus: 'WRONG_ANSWER',
      passedCount: 0,
      totalCount: testCases.length || 1,
      executionTimeMs: 0,
      memoryKb: 0,
      compileOutput: 'No code assembled at time of auto-submission.',
      details: testCases.map((tc) => ({
        testCaseId: tc._id,
        passed: false,
        status: 'WRONG_ANSWER',
        stdout: '',
        stderr: 'No code submitted',
      })),
    };
  } else {
    evalResult = await evaluateAllTestCases({
      sourceCode,
      language,
      testCases,
    });
  }

  const isAccepted = evalResult.overallStatus === 'ACCEPTED';
  const wrongAttempts = (session?.wrongAttemptsCount || 0) + (isAccepted ? 0 : 1);

  // 5. Calculate scores with points system
  const sessionStart = session?.startTime ? new Date(session.startTime).getTime() : Date.now();
  const timeTakenSeconds = Math.max(1, Math.floor((Date.now() - sessionStart) / 1000));
  const timeMinutesExhausted = Math.floor(timeTakenSeconds / 60);

  let timePenaltyPoints = 0;
  let taskPenaltyPoints = 0;
  let runPenaltyPoints = 0;
  let totalPenaltyPoints = 0;
  let finalScore = 0;

  if (isAutoSubmit) {
    if (isAccepted) {
      // Auto-submit correctly assembled: 0 negative points (no penalty)
      taskPenaltyPoints = 0;
      runPenaltyPoints = 0;
      timePenaltyPoints = 0;
      totalPenaltyPoints = 0;
      finalScore = 0;
    } else {
      // Auto-submit incorrect: -50 negative penalty points
      taskPenaltyPoints = 0;
      runPenaltyPoints = 0;
      timePenaltyPoints = 0;
      totalPenaltyPoints = 50;
      finalScore = -50;
    }
  } else {
    // Normal manual submission
    timePenaltyPoints = timeMinutesExhausted * 10;
    taskPenaltyPoints = session?.taskPenaltyPoints || 0;
    runPenaltyPoints = session?.runPenaltyPoints || 0;
    totalPenaltyPoints = taskPenaltyPoints + runPenaltyPoints + timePenaltyPoints;
    finalScore = -totalPenaltyPoints;
  }

  let previousChallengesPenalty = 0;
  if (req.user && targetChallengeId) {
    const otherSessions = await ParticipantSession.find({
      userId: req.user._id,
      challengeId: { $ne: targetChallengeId },
    }).lean();
    for (const s of otherSessions) {
      previousChallengesPenalty += (s.totalPenaltyPoints || 0);
    }
  }
  const overallTotalPenaltyPoints = previousChallengesPenalty + totalPenaltyPoints;
  const overallScore = -overallTotalPenaltyPoints;

  let attemptNumber = 1;
  if (req.user && targetChallengeId) {
    const prevAttempts = await Submission.countDocuments({
      userId: req.user._id,
      challengeId: targetChallengeId,
    });
    attemptNumber = prevAttempts + 1;
  }

  // 6. Record submission in DB
  let sub = null;
  if (targetChallengeId) {
    try {
      sub = await Submission.create({
        userId: req.user?._id || null,
        challengeId: targetChallengeId,
        code: sourceCode || '# Auto-submitted (empty)',
        language,
        assembledBlockIds: session?.assemblyOrder || (Array.isArray(assembledBlockIds) ? assembledBlockIds : []),
        status: evalResult.overallStatus,
        testCasesPassed: evalResult.passedCount,
        totalTestCases: evalResult.totalCount,
        timeTakenSeconds,
        attemptNumber,
        executionTimeMs: evalResult.executionTimeMs || 0,
        memoryKb: evalResult.memoryKb || 0,
        compileOutput: evalResult.compileOutput || '',
        score: finalScore,
        taskPenaltyPoints,
        runPenaltyPoints,
        timePenaltyPoints,
        totalPenaltyPoints,
        revealPenalty: 0,
        wrongSubmissionPenalty: isAutoSubmit && !isAccepted ? 50 : 0,
        testCaseResults: evalResult.details.map((d) => {
          const tc = testCases.find((t) => String(t._id) === String(d.testCaseId));
          return {
            testCaseId: tc ? tc._id : d.testCaseId,
            passed: d.passed,
            input: tc ? tc.input : '',
            expectedOutput: tc ? tc.expectedOutput : '',
            actualOutput: d.stdout || '',
            compileError: d.compileOutput || '',
            runtimeError: d.stderr || '',
            isHidden: tc ? tc.isHidden : false,
            status: d.status,
            time: d.time,
          };
        }),
      });
    } catch (dbErr) {
      console.warn('[SubmissionController.submitSolution] Could not save submission to DB:', dbErr.message);
    }
  }

  // 7. Update session if exists
  if (session) {
    session.wrongAttemptsCount = wrongAttempts;
    session.taskPenaltyPoints = taskPenaltyPoints;
    session.runPenaltyPoints = runPenaltyPoints;
    session.timePenaltyPoints = timePenaltyPoints;
    session.totalPenaltyPoints = totalPenaltyPoints;
    session.currentScore = finalScore;
    session.scoreAwarded = finalScore;

    if (isAccepted) {
      session.isCompleted = true;
      session.status = 'COMPLETED';
      session.durationSeconds = timeTakenSeconds;
      session.endTime = new Date();
    } else if (isAutoSubmit) {
      session.isCompleted = true;
      session.status = 'EXPIRED';
      session.durationSeconds = session.durationSeconds || timeTakenSeconds;
      session.endTime = new Date();
    }
    session.lastActivityAt = new Date();
    try {
      await session.save();
    } catch (saveErr) {
      console.warn('[SubmissionController.submitSolution] Session save warning:', saveErr.message);
    }
  }

  // 8. Sanitize test results for contestant output (hide expected output on hidden tests)
  const sanitizedResults = evalResult.details.map((d) => {
    const tc = testCases.find((t) => String(t._id) === String(d.testCaseId));
    const isHidden = tc ? tc.isHidden : false;
    return {
      testCaseId: d.testCaseId,
      passed: d.passed,
      status: d.passed ? 'PASSED' : d.status,
      isHidden,
      input: isHidden ? '[Hidden Test Case]' : tc?.input,
      expectedOutput: isHidden ? '[Hidden]' : tc?.expectedOutput,
      actualOutput: isHidden ? (d.passed ? '[Matched]' : '[Mismatch/Error]') : d.stdout,
      time: d.time || '0.02s',
    };
  });

  return res.status(200).json({
    success: isAccepted,
    submissionId: sub?._id || 'local-sub',
    status: evalResult.overallStatus,
    title: isAccepted
      ? '🎉 ACCEPTED'
      : (isAutoSubmit ? '⌛ TIME EXPIRED (AUTO-SUBMITTED)' : '❌ WRONG ANSWER'),
    message: isAccepted
      ? 'All test cases passed successfully!'
      : (isAutoSubmit
          ? 'Time expired. Solution was auto-submitted and failed test cases (-50 pts penalty applied).'
          : 'Some test cases failed. Re-evaluate your block arrangement.'),
    score: finalScore,
    currentScore: finalScore,
    previousChallengesPenalty,
    overallTotalPenaltyPoints,
    overallScore,
    passedCount: evalResult.passedCount,
    totalCount: evalResult.totalCount,
    penalties: totalPenaltyPoints,
    taskPenaltyPoints,
    runPenaltyPoints,
    timePenaltyPoints,
    totalPenaltyPoints,
    testResults: sanitizedResults,
    executionTime: evalResult.details[0]?.time || '0.04s',
    memory: '12.0 MB',
    isAutoSubmit,
  });
});

/**
 * Get history for current user & challenge
 * GET /api/submissions/history/:challengeId
 */
exports.getUserHistory = asyncHandler(async (req, res) => {
  const query = { challengeId: req.params.challengeId };
  if (req.user?._id) {
    query.userId = req.user._id;
  }
  const history = await Submission.find(query).sort({ createdAt: -1 }).limit(20);
  res.json({ success: true, history });
});

/**
 * Get single submission by ID
 * GET /api/submissions/:id
 */
exports.getSubmissionById = asyncHandler(async (req, res) => {
  const sub = await Submission.findById(req.params.id);
  if (!sub) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }
  res.json({ success: true, submission: sub });
});
