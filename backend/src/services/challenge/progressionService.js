const Challenge = require('../../models/Challenge');
const Submission = require('../../models/Submission');
const Settings = require('../../models/Settings');

/**
 * Returns participant-facing challenges ordered strictly by sequenceOrder (1 -> 2 -> 3).
 */
async function getSequence() {
  const list = await Challenge.find({
    isActive: true,
    status: 'Published',
    sequenceOrder: { $in: [1, 2, 3] },
  })
    .sort({ sequenceOrder: 1 })
    .lean();

  if (list.length > 0) return list;

  // Fallback if sequenceOrder has not been seeded yet
  return await Challenge.find({ isActive: true, status: 'Published' })
    .sort({ createdAt: 1 })
    .limit(3)
    .lean();
}

/**
 * Resolves a challenge document from an ObjectId string, slug, or document
 */
async function resolveChallenge(idOrDoc) {
  if (!idOrDoc) return null;
  if (typeof idOrDoc === 'object' && (idOrDoc.title || idOrDoc.difficulty || idOrDoc.slug)) {
    return idOrDoc;
  }
  const str = String(idOrDoc);
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    const c = await Challenge.findById(str).lean();
    if (c) return c;
  }
  return await Challenge.findOne({
    $or: [{ slug: str }, { slug: str.toLowerCase() }],
  }).lean();
}

/**
 * Computes strict sequential challenge progression for a given user.
 * Exactly 1 query for published challenges, 1 query for user's accepted submissions (no N+1).
 *
 * Each step returned:
 *   { challengeId, slug, title, difficulty, points, sequenceOrder, status }
 * where status is:
 *   - 'COMPLETED' if the user has an ACCEPTED submission for that challenge
 *   - 'CURRENT' if it is the first uncompleted challenge in sequence
 *   - 'LOCKED' otherwise
 */
async function getProgressForUser(userId, userObj = null) {
  const settings = await Settings.findOne().lean();
  const enforceProgression = settings?.enforceProgression !== false;
  const isAdmin = userObj?.role === 'admin';

  // 1. Fetch participant-facing sequence
  const challenges = await getSequence();

  // 2. Fetch accepted submissions for user (source of truth = ACCEPTED submission only)
  const acceptedIds = new Set();
  if (userId) {
    const acceptedSubs = await Submission.find({
      userId,
      status: 'ACCEPTED',
    })
      .select('challengeId')
      .lean();

    acceptedSubs.forEach((sub) => {
      if (sub.challengeId) {
        acceptedIds.add(String(sub.challengeId).toLowerCase());
      }
    });
  }

  // 3. Compute status per step in strict linear order
  let foundCurrent = false;
  let currentChallengeSlug = null;

  const progress = challenges.map((c, idx) => {
    const isAccepted =
      acceptedIds.has(String(c._id).toLowerCase()) ||
      (c.slug && acceptedIds.has(String(c.slug).toLowerCase()));

    let status = 'LOCKED';

    if (isAccepted) {
      status = 'COMPLETED';
    } else if (!enforceProgression || isAdmin) {
      // When progression is not enforced or user is admin, everything uncompleted is open
      status = 'CURRENT';
      if (!currentChallengeSlug) {
        currentChallengeSlug = c.slug;
      }
    } else if (!foundCurrent) {
      status = 'CURRENT';
      foundCurrent = true;
      currentChallengeSlug = c.slug;
    } else {
      status = 'LOCKED';
    }

    return {
      challengeId: c._id,
      slug: c.slug,
      title: c.title,
      difficulty: c.difficulty,
      points: c.points,
      sequenceOrder: c.sequenceOrder || idx + 1,
      status, // 'COMPLETED' | 'CURRENT' | 'LOCKED'
    };
  });

  const allCompleted =
    challenges.length > 0 &&
    challenges.every(
      (c) =>
        acceptedIds.has(String(c._id).toLowerCase()) ||
        (c.slug && acceptedIds.has(String(c.slug).toLowerCase()))
    );

  if (allCompleted) {
    currentChallengeSlug = null;
  }

  return {
    progress,
    currentChallengeSlug,
    allCompleted,
    enforceProgression,
  };
}

/**
 * Asserts whether a challenge is currently accessible by the participant.
 * Allowed ONLY if status is 'CURRENT'.
 * Rejects 'COMPLETED' (no replay once accepted) and 'LOCKED'.
 * Admins bypass all restrictions.
 */
async function assertChallengeAccessible(user, idOrDoc) {
  // Admins bypass all locks
  if (user?.role === 'admin') {
    return { allowed: true };
  }

  const challenge = await resolveChallenge(idOrDoc);
  if (!challenge) {
    return { allowed: true };
  }

  // Check global setting
  const settings = await Settings.findOne().lean();
  if (settings?.enforceProgression === false) {
    return { allowed: true };
  }

  if (!user || !user._id) {
    return {
      allowed: false,
      code: 'CHALLENGE_LOCKED',
      message: 'Registration required. Please register first.',
      currentChallengeSlug: null,
    };
  }

  const { progress, currentChallengeSlug } = await getProgressForUser(user._id, user);
  const targetId = String(challenge._id || '').toLowerCase();
  const targetSlug = String(challenge.slug || '').toLowerCase();

  const step = progress.find(
    (p) =>
      String(p.challengeId).toLowerCase() === targetId ||
      String(p.slug || '').toLowerCase() === targetSlug
  );

  if (!step) {
    return { allowed: true, currentChallengeSlug };
  }

  if (step.status === 'COMPLETED') {
    return {
      allowed: false,
      code: 'CHALLENGE_COMPLETED',
      message: 'You have already completed this challenge. Replay is disabled to preserve official scores.',
      currentChallengeSlug,
    };
  }

  if (step.status === 'LOCKED') {
    const prevStep = progress.find((p) => p.sequenceOrder === (step.sequenceOrder || 1) - 1);
    const prevTitle = prevStep ? prevStep.title : 'previous challenge';
    return {
      allowed: false,
      code: 'CHALLENGE_LOCKED',
      message: `Complete "${prevTitle}" first to unlock this challenge.`,
      currentChallengeSlug,
    };
  }

  // status === 'CURRENT'
  return { allowed: true, currentChallengeSlug };
}

/**
 * Reusable helper for Express controller endpoints.
 * If challenge is inaccessible (LOCKED or COMPLETED), responds with 403 and returns false.
 * Otherwise returns true.
 */
async function checkChallengeAccessible(req, res, idOrDoc) {
  const check = await assertChallengeAccessible(req.user, idOrDoc);
  if (!check.allowed) {
    res.status(403).json({
      success: false,
      code: check.code,
      message: check.message,
      currentChallengeSlug: check.currentChallengeSlug,
    });
    return false;
  }
  return true;
}

module.exports = {
  getSequence,
  getProgressForUser,
  assertChallengeAccessible,
  checkChallengeAccessible,
  // Backward compatibility aliases
  checkChallengeLock: checkChallengeAccessible,
  assertChallengeUnlocked: assertChallengeAccessible,
};
