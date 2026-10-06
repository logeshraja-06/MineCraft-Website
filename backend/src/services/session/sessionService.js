const mongoose = require('mongoose');
const ParticipantSession = require('../../models/ParticipantSession');
const Challenge = require('../../models/Challenge');

exports.getOrCreateSession = async (userId, challengeId) => {
  let session = await ParticipantSession.findOne({ userId, challengeId });
  if (!session) {
    session = await ParticipantSession.create({ userId, challengeId, scannedBlocks: [] });
  }
  return session;
};

/**
 * Computes current live points breakdown for a session.
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

  const isExpired = session.status === 'EXPIRED';
  const timePenaltyPoints = session.timePenaltyPoints !== undefined && session.timePenaltyPoints > 0
    ? session.timePenaltyPoints
    : (isExpired ? 150 : timeMinutesExhausted * 10);

  const taskPenaltyPoints = session.taskPenaltyPoints || 0;
  const runPenaltyPoints = session.runPenaltyPoints || 0;
  const runCount = session.runCount || 0;
  const runsRemainingFree = Math.max(0, 3 - runCount);

  const totalPenaltyPoints = session.totalPenaltyPoints !== undefined && session.totalPenaltyPoints > 0
    ? session.totalPenaltyPoints
    : (taskPenaltyPoints + runPenaltyPoints + timePenaltyPoints);
  const currentScore = -totalPenaltyPoints;

  return {
    currentScore,
    totalPenaltyPoints,
    taskPenaltyPoints,
    runPenaltyPoints,
    timePenaltyPoints,
    runCount,
    runsRemainingFree,
    timeMinutesExhausted: isExpired ? Math.max(15, timeMinutesExhausted) : timeMinutesExhausted,
  };
}

/**
 * Computes live points for this session PLUS cumulative history from other challenges.
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
    if (session.challengeId && String(s.challengeId) === String(session.challengeId)) continue;
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
 * Calculates and applies penalties when a session expires without an accepted solution.
 */
async function applySessionExpirationPenalties(session, challenge = null) {
  if (!session) return;
  let challengeDoc = challenge;
  if (!challengeDoc && session.challengeId) {
    challengeDoc = await Challenge.findById(session.challengeId).lean();
    if (!challengeDoc) {
      challengeDoc = await Challenge.findOne({ slug: session.challengeId }).lean();
    }
  }

  const totalTasks = (challengeDoc?.tasks && challengeDoc.tasks.length > 0) ? challengeDoc.tasks.length : 4;
  const completedCount = session.completedTaskIds ? session.completedTaskIds.length : 0;
  const uncompletedCount = Math.max(0, totalTasks - completedCount);
  const unsubmittedTaskPenalty = uncompletedCount * 20;

  const timePenaltyPoints = 150; // 150 pts for time exhausted
  const existingTaskPenalties = session.taskPenaltyPoints || 0;
  const taskPenaltyPoints = existingTaskPenalties + unsubmittedTaskPenalty;
  const runPenaltyPoints = session.runPenaltyPoints || 0;
  const wrongSolutionPenalty = 50; // 50 pts for wrong solution / incomplete assembly

  const totalPenaltyPoints = taskPenaltyPoints + runPenaltyPoints + timePenaltyPoints + wrongSolutionPenalty;
  const finalScore = -totalPenaltyPoints;

  session.timePenaltyPoints = timePenaltyPoints;
  session.taskPenaltyPoints = taskPenaltyPoints;
  session.runPenaltyPoints = runPenaltyPoints;
  session.totalPenaltyPoints = totalPenaltyPoints;
  session.currentScore = finalScore;
  session.scoreAwarded = finalScore;
  session.wrongAttemptsCount = (session.wrongAttemptsCount || 0) + 1;
  session.status = 'EXPIRED';
  session.isCompleted = true;
  session.endTime = session.endTime || new Date();
  session.durationSeconds = session.durationSeconds || 900;
}

exports.computeSessionPoints = computeSessionPoints;
exports.computeSessionPointsWithHistory = computeSessionPointsWithHistory;
exports.applySessionExpirationPenalties = applySessionExpirationPenalties;
