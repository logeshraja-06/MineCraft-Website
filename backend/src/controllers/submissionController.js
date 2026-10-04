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
  }

  try {
    // Attempt execution via testRunner / Judge0
    const outcome = await runSingleTestCase({
      sourceCode: sourceCode.trim(),
      language,
      input: typeof stdin === 'string' ? stdin : String(stdin || ''),
      expectedOutput: '',
    });

    const isAccepted = outcome.status === 'ACCEPTED' || outcome.status === 'Accepted' || outcome.passed;

    return res.status(200).json({
      success: true,
      status: outcome.status || 'Accepted',
      stdout: outcome.stdout || '',
      stderr: outcome.stderr || '',
      compileOutput: outcome.compileOutput || '',
      output: outcome.stdout || outcome.stderr || outcome.compileOutput || '',
      message: isAccepted ? 'Execution completed successfully.' : 'Execution finished with output.',
      executionTime: outcome.time || '0.04s',
      memory: outcome.memory || 0,
      time: outcome.time || '0.04s',
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
  const sourceCode = req.body?.sourceCode !== undefined ? req.body.sourceCode : req.body?.code;
  const challengeId = req.body?.challengeId || 'ch-05';
  const assembledBlockIds = req.body?.assembledBlockIds || req.body?.blocksUsed || [];

  if (!language || !isSupportedLanguage(language)) {
    return res.status(400).json({
      success: false,
      message: `Valid language (c, cpp, java, python) is required`,
    });
  }

  if (!sourceCode || !sourceCode.trim()) {
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

      // Server-side check that submitted code matches assembled blocks in saved order
      if (session && (session.assemblyOrder?.length > 0 || (session.assembledCode && session.assembledCode.trim()))) {
        const expectedCode = getAssembledCodeFromSession(session);
        if (expectedCode && normalizeCode(sourceCode) !== normalizeCode(expectedCode)) {
          return res.status(400).json({
            success: false,
            message: 'Submitted code does not match your assembled session blocks.',
          });
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

  // 4. Evaluate test cases
  const evalResult = await evaluateAllTestCases({
    sourceCode,
    language,
    testCases,
  });

  const isAccepted = evalResult.overallStatus === 'ACCEPTED';
  const wrongAttempts = (session?.wrongAttemptsCount || 0) + (isAccepted ? 0 : 1);

  // 5. Calculate scores
  const scoreBreakdown = calculateSubmissionScore({
    challenge: challenge || { points: 100 },
    testCases,
    testResults: evalResult.details,
    revealsCount: session?.revealsCount || 0,
    wrongAttemptsCount: wrongAttempts,
  });

  // Calculate server-authoritative timeTakenSeconds and attemptNumber
  const sessionStart = session?.startTime ? new Date(session.startTime).getTime() : Date.now();
  const timeTakenSeconds = Math.max(0, Math.floor((Date.now() - sessionStart) / 1000));

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
        code: sourceCode,
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
        score: scoreBreakdown.finalScore,
        revealPenalty: scoreBreakdown.revealPenalty,
        wrongSubmissionPenalty: scoreBreakdown.wrongSubmissionPenalty,
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
    if (scoreBreakdown.finalScore > (session.scoreAwarded || 0)) {
      session.scoreAwarded = scoreBreakdown.finalScore;
    }
    if (isAccepted) {
      session.isCompleted = true;
      session.status = 'COMPLETED';
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
    title: isAccepted ? '🎉 ACCEPTED' : '❌ WRONG ANSWER',
    message: isAccepted
      ? 'All test cases passed successfully!'
      : 'Some test cases failed. Re-evaluate your block arrangement.',
    score: scoreBreakdown.finalScore,
    passedCount: evalResult.passedCount,
    totalCount: evalResult.totalCount,
    penalties: scoreBreakdown.totalPenalties,
    testResults: sanitizedResults,
    executionTime: evalResult.details[0]?.time || '0.04s',
    memory: '12.0 MB',
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
