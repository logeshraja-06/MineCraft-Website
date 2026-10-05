const Submission = require('../../models/Submission');
const User = require('../../models/User');
const Challenge = require('../../models/Challenge');
const Settings = require('../../models/Settings');

let frozenLeaderboardCache = null;

/**
 * Format total seconds into "Xm Ys" format
 */
function formatTime(totalSeconds = 0) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}m ${String(secs).padStart(2, '0')}s`;
}

/**
 * Fetch server-authoritative leaderboard rankings using MongoDB aggregation.
 * Scoring rules:
 * - Distinct accepted challenge solutions only.
 * - Score = sum of challenge.points.
 * - Total time = sum of timeTakenSeconds + 300s (5 minutes) per failed attempt before acceptance.
 * - Sorting = score desc, totalTimeSeconds asc, earliest final accepted timestamp asc.
 */
exports.getLeaderboardData = async ({ forceFresh = false } = {}) => {
  const settings = await Settings.findOne().lean();
  const isFrozen = settings?.isLeaderboardFrozen || settings?.leaderboardVisibility === 'Frozen';

  if (isFrozen && frozenLeaderboardCache && !forceFresh) {
    return frozenLeaderboardCache.map((entry) => ({ ...entry, isFrozen: true }));
  }

  // 1. Fetch all participants
  const participants = await User.find({
    role: { $ne: 'admin' },
    email: { $ne: 'admin@mindcraft.local' },
  })
    .select('name email participantId college department createdAt')
    .lean();

  if (!participants.length) {
    return [];
  }

  // 2. Fetch all sessions for penalty breakdown fallback
  const ParticipantSession = require('../../models/ParticipantSession');
  const allSessions = await ParticipantSession.find({}).lean();
  const sessionUserMap = new Map();
  allSessions.forEach((s) => {
    if (!s.userId) return;
    const uId = String(s.userId);
    if (!sessionUserMap.has(uId)) {
      sessionUserMap.set(uId, new Map());
    }
    sessionUserMap.get(uId).set(String(s.challengeId), s);
  });

  // 3. Aggregate submissions per participant and per challenge
  const rawSubmissions = await Submission.aggregate([
    {
      $lookup: {
        from: 'challenges',
        localField: 'challengeId',
        foreignField: '_id',
        as: 'challengeInfo',
      },
    },
    {
      $unwind: {
        path: '$challengeInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: { createdAt: 1 },
    },
  ]);

  // Group submissions by userId -> challengeId
  const userSubsMap = new Map();
  rawSubmissions.forEach((sub) => {
    if (!sub.userId) return;
    const uId = String(sub.userId);
    if (!userSubsMap.has(uId)) {
      userSubsMap.set(uId, []);
    }
    userSubsMap.get(uId).push(sub);
  });

  const leaderboardRows = participants.map((user) => {
    const uId = String(user._id);
    const userSubs = userSubsMap.get(uId) || [];
    const userSessions = sessionUserMap.get(uId) || new Map();

    // Group submissions by challenge
    const challengeMap = new Map();
    userSubs.forEach((sub) => {
      const cId = String(sub.challengeId);
      if (!challengeMap.has(cId)) {
        challengeMap.set(cId, []);
      }
      challengeMap.get(cId).push(sub);
    });

    let totalScore = 0;
    let totalTimeSeconds = 0;
    let challengesSolved = 0;
    let totalTaskPenalties = 0;
    let totalRunPenalties = 0;
    let totalTimePenalties = 0;
    let totalPenalties = 0;
    let lastAcceptedTime = null;
    let lastSubmissionTime = null;

    if (userSubs.length > 0) {
      lastSubmissionTime = userSubs[userSubs.length - 1].createdAt;
    }

    challengeMap.forEach((subs, cId) => {
      // Find the accepted submission for this challenge
      const acceptedIndex = subs.findIndex((s) => s.status === 'ACCEPTED');
      if (acceptedIndex !== -1) {
        const acceptedSub = subs[acceptedIndex];
        const session = userSessions.get(cId);
        challengesSolved++;

        const timeTaken = Number(acceptedSub.timeTakenSeconds) || 0;
        totalTimeSeconds += timeTaken;

        // Calculate penalties in new points system
        const taskPenalty = Number(acceptedSub.taskPenaltyPoints) || Number(session?.taskPenaltyPoints) || 0;
        const runPenalty = Number(acceptedSub.runPenaltyPoints) || Number(session?.runPenaltyPoints) || 0;
        const timePenalty = Number(acceptedSub.timePenaltyPoints) || Number(session?.timePenaltyPoints) || (Math.floor(timeTaken / 60) * 10);
        const challengePenalty = Number(acceptedSub.totalPenaltyPoints) || (taskPenalty + runPenalty + timePenalty);

        // Challenge score is negative points (e.g. -40) or 0
        let challengeScore = 0;
        if (typeof acceptedSub.score === 'number' && acceptedSub.score <= 0) {
          challengeScore = acceptedSub.score;
        } else {
          challengeScore = -challengePenalty;
        }

        totalTaskPenalties += taskPenalty;
        totalRunPenalties += runPenalty;
        totalTimePenalties += timePenalty;
        totalPenalties += challengePenalty;
        totalScore += challengeScore;

        const acceptedDate = new Date(acceptedSub.createdAt);
        if (!lastAcceptedTime || acceptedDate > lastAcceptedTime) {
          lastAcceptedTime = acceptedDate;
        }
      }
    });

    return {
      id: user._id,
      participantId: user.participantId || `MC-${String(user._id).slice(-4).toUpperCase()}`,
      name: user.name,
      email: user.email,
      college: user.college || 'N/A',
      department: user.department || 'N/A',
      challengesSolved,
      score: totalScore,
      totalScore,
      taskPenaltyPoints: totalTaskPenalties,
      runPenaltyPoints: totalRunPenalties,
      timePenaltyPoints: totalTimePenalties,
      totalPenaltyPoints: totalPenalties,
      totalTimeSeconds,
      formattedTime: formatTime(totalTimeSeconds),
      timeFormatted: formatTime(totalTimeSeconds),
      lastAcceptedTime,
      lastSubmissionTime,
      totalSubmissions: userSubs.length,
      isFrozen,
    };
  });

  // Sort centrally managed rankings:
  // 1. Challenges solved descending (3/3 completed first)
  // 2. Score descending (since scores are negative e.g. -20 > -80, minimum negative points is winner!)
  // 3. Total time ascending (tiebreaker)
  // 4. Earliest final accepted timestamp ascending (tiebreaker)
  leaderboardRows.sort((a, b) => {
    if (b.challengesSolved !== a.challengesSolved) {
      return b.challengesSolved - a.challengesSolved;
    }
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.totalTimeSeconds !== b.totalTimeSeconds) {
      return a.totalTimeSeconds - b.totalTimeSeconds;
    }
    if (a.lastAcceptedTime && b.lastAcceptedTime) {
      return new Date(a.lastAcceptedTime) - new Date(b.lastAcceptedTime);
    }
    if (a.lastAcceptedTime && !b.lastAcceptedTime) return -1;
    if (!a.lastAcceptedTime && b.lastAcceptedTime) return 1;
    return new Date(a.id.getTimestamp ? a.id.getTimestamp() : 0) - new Date(b.id.getTimestamp ? b.id.getTimestamp() : 0);
  });

  // Assign ranks and winner status
  const ranked = leaderboardRows.map((entry, index) => ({
    rank: index + 1,
    isWinner: index === 0 && entry.challengesSolved === 3,
    ...entry,
  }));

  if (isFrozen) {
    frozenLeaderboardCache = ranked;
  } else {
    frozenLeaderboardCache = null;
  }

  return ranked;
};

exports.freezeLeaderboard = async (shouldFreeze = true) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  settings.isLeaderboardFrozen = shouldFreeze;
  settings.leaderboardVisibility = shouldFreeze ? 'Frozen' : 'Public';
  await settings.save();

  if (shouldFreeze) {
    // Snapshot current state
    return exports.getLeaderboardData({ forceFresh: true });
  } else {
    frozenLeaderboardCache = null;
  }
  return true;
};
