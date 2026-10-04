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

  // 2. Aggregate submissions per participant and per challenge
  // Find all submissions populated with challenge info
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
    let lastAcceptedTime = null;
    let lastSubmissionTime = null;

    if (userSubs.length > 0) {
      lastSubmissionTime = userSubs[userSubs.length - 1].createdAt;
    }

    challengeMap.forEach((subs, cId) => {
      // Find the first accepted submission for this challenge
      const acceptedIndex = subs.findIndex((s) => s.status === 'ACCEPTED');
      if (acceptedIndex !== -1) {
        const acceptedSub = subs[acceptedIndex];
        challengesSolved++;

        // Challenge points
        const points = Number(acceptedSub.challengeInfo?.points) || Number(acceptedSub.score) || 100;
        totalScore += points;

        // Failed attempts strictly before this accepted submission
        const failedBefore = acceptedIndex; // each index before was non-accepted
        const timeTaken = Number(acceptedSub.timeTakenSeconds) || 0;
        const penaltySeconds = failedBefore * 300; // 5 minutes (300s) penalty per failed attempt
        totalTimeSeconds += (timeTaken + penaltySeconds);

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
      totalTimeSeconds,
      formattedTime: formatTime(totalTimeSeconds),
      timeFormatted: formatTime(totalTimeSeconds),
      lastAcceptedTime,
      lastSubmissionTime,
      totalSubmissions: userSubs.length,
      isFrozen,
    };
  });

  // Sort by:
  // 1. Score descending
  // 2. Total time ascending
  // 3. Earliest final accepted timestamp ascending (tiebreaker)
  leaderboardRows.sort((a, b) => {
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

  // Assign ranks
  const ranked = leaderboardRows.map((entry, index) => ({
    rank: index + 1,
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
