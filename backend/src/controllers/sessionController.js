const asyncHandler = require('../utils/asyncHandler');
const ParticipantSession = require('../models/ParticipantSession');
const Challenge = require('../models/Challenge');
const QRBlock = require('../models/QRBlock');
const { checkIfSessionExpired, calculateRemainingTime } = require('../services/session/timerService');
const { computeSessionPointsWithHistory, applySessionExpirationPenalties } = require('../services/session/sessionService');
const { checkChallengeLock } = require('../services/challenge/progressionService');

async function findChallenge(idOrSlug) {
  if (!idOrSlug) return null;
  if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
    const c = await Challenge.findById(idOrSlug);
    if (c) return c;
  }
  return await Challenge.findOne({
    $or: [{ slug: idOrSlug }, { slug: String(idOrSlug).toLowerCase() }],
  });
}

/**
 * POST /api/sessions/start
 * Server-authoritative start of a challenge session.
 */
exports.startSession = asyncHandler(async (req, res) => {
  const { challengeId, language = 'python' } = req.body || {};

  if (!challengeId) {
    return res.status(400).json({ success: false, message: 'challengeId is required' });
  }

  const challenge = await findChallenge(challengeId);
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  if (!(await checkChallengeLock(req, res, challenge))) {
    return;
  }

  const durationSeconds = challenge.timeLimitSeconds || 1200;

  // Look for existing active session for this challenge
  let session = await ParticipantSession.findOne({
    userId: req.user._id,
    challengeId: challenge._id,
    isCompleted: false,
  });

  if (session) {
    if (checkIfSessionExpired(session.startTime, session.durationSeconds || durationSeconds)) {
      await applySessionExpirationPenalties(session, challenge);
      await session.save();
      const pointsInfo = await computeSessionPointsWithHistory(session);
      return res.status(403).json({
        success: false,
        message: 'Your challenge session has expired.',
        isExpired: true,
        points: pointsInfo,
      });
    }

    // Update language if provided and session still idle
    if (language && !session.scannedBlocks?.length && !session.assemblyOrder?.length) {
      session.selectedLanguage = language;
      await session.save();
    }
  } else {
    // Create new session
    session = await ParticipantSession.create({
      userId: req.user._id,
      challengeId: challenge._id,
      selectedLanguage: language,
      durationSeconds,
      startTime: new Date(),
      status: 'ACTIVE',
      scannedBlocks: [],
      assemblyOrder: [],
      assembledCode: '',
    });
  }

  const remainingSeconds = calculateRemainingTime(session.startTime, session.durationSeconds);
  const pointsInfo = await computeSessionPointsWithHistory(session);

  res.status(200).json({
    success: true,
    session: {
      _id: session._id,
      challengeId: session.challengeId,
      selectedLanguage: session.selectedLanguage,
      startTime: session.startTime,
      durationSeconds: session.durationSeconds,
      status: session.status,
      scannedBlocks: session.scannedBlocks,
      assemblyOrder: session.assemblyOrder,
      assembledCode: session.assembledCode,
      points: pointsInfo,
      currentScore: pointsInfo.currentScore,
      previousChallengesPenalty: pointsInfo.previousChallengesPenalty,
      overallTotalPenaltyPoints: pointsInfo.overallTotalPenaltyPoints,
      overallScore: pointsInfo.overallScore,
    },
    points: pointsInfo,
    serverTime: Date.now(),
    remainingSeconds,
  });
});

/**
 * PUT /api/sessions/assembly
 * Persists the user's arranged block order and assembled code on the server.
 */
exports.saveAssembly = asyncHandler(async (req, res) => {
  const { challengeId, assemblyOrder = [], assembledCode = '' } = req.body || {};

  if (!challengeId) {
    return res.status(400).json({ success: false, message: 'challengeId is required' });
  }

  const challenge = await findChallenge(challengeId);
  if (challenge && !(await checkChallengeLock(req, res, challenge))) {
    return;
  }
  const targetId = challenge ? challenge._id : challengeId;

  const session = await ParticipantSession.findOne({
    userId: req.user._id,
    challengeId: targetId,
    isCompleted: false,
  });

  if (!session) {
    return res.status(404).json({ success: false, message: 'Active session not found' });
  }

  session.assemblyOrder = Array.isArray(assemblyOrder) ? assemblyOrder : session.assemblyOrder;
  session.assembledCode = typeof assembledCode === 'string' ? assembledCode : session.assembledCode;
  session.lastActivityAt = new Date();
  await session.save();

  const isExpired = checkIfSessionExpired(session.startTime, session.durationSeconds);
  if (isExpired) {
    return res.json({
      success: true,
      message: 'Assembly order saved before expiration',
      assemblyOrder: session.assemblyOrder,
      assembledCode: session.assembledCode,
      isExpired: true,
    });
  }

  res.json({
    success: true,
    message: 'Assembly order saved to server',
    assemblyOrder: session.assemblyOrder,
    assembledCode: session.assembledCode,
  });
});

/**
 * GET /api/sessions/current/:challengeId
 * Retrieves current active session for the authenticated user with time remaining.
 */
exports.getCurrentSession = asyncHandler(async (req, res) => {
  const challenge = await findChallenge(req.params.challengeId);
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found' });
  }

  const session = await ParticipantSession.findOne({
    userId: req.user._id,
    challengeId: challenge._id,
  }).sort({ createdAt: -1 });

  if (!session) {
    return res.json({ success: true, session: null });
  }

  const isExpired = checkIfSessionExpired(session.startTime, session.durationSeconds);
  if (isExpired && !session.isCompleted) {
    await applySessionExpirationPenalties(session, challenge);
    await session.save();
  }

  const pointsInfo = await computeSessionPointsWithHistory(session);
  const remainingSeconds = calculateRemainingTime(session.startTime, session.durationSeconds);

  res.json({
    success: true,
    session: {
      _id: session._id,
      challengeId: session.challengeId,
      selectedLanguage: session.selectedLanguage,
      startTime: session.startTime,
      durationSeconds: session.durationSeconds,
      status: session.status,
      scannedBlocks: session.scannedBlocks,
      assemblyOrder: session.assemblyOrder,
      assembledCode: session.assembledCode,
      isCompleted: session.isCompleted,
      points: pointsInfo,
      currentScore: pointsInfo.currentScore,
      previousChallengesPenalty: pointsInfo.previousChallengesPenalty,
      overallTotalPenaltyPoints: pointsInfo.overallTotalPenaltyPoints,
      overallScore: pointsInfo.overallScore,
    },
    points: pointsInfo,
    serverTime: Date.now(),
    remainingSeconds,
    isExpired,
  });
});

exports.getUserSessions = asyncHandler(async (req, res) => {
  const sessions = await ParticipantSession.find({ userId: req.user._id }).lean();
  const enriched = await Promise.all(
    sessions.map(async (sess) => {
      if (sess.challengeId && /^[0-9a-fA-F]{24}$/.test(String(sess.challengeId))) {
        const chal = await Challenge.findById(sess.challengeId).select('title duration points').lean();
        return { ...sess, challengeId: chal || sess.challengeId };
      }
      return sess;
    })
  );
  res.json({ success: true, sessions: enriched });
});
