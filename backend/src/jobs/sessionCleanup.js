const ParticipantSession = require('../models/ParticipantSession');
const { logger } = require('../utils/logger');
const { checkIfSessionExpired } = require('../services/session/timerService');
const { applySessionExpirationPenalties } = require('../services/session/sessionService');

exports.cleanupExpiredSessions = async () => {
  try {
    const activeSessions = await ParticipantSession.find({
      status: 'ACTIVE',
      isCompleted: false,
    });

    let expiredCount = 0;
    const now = Date.now();

    for (const session of activeSessions) {
      const duration = session.durationSeconds || 1200;
      if (checkIfSessionExpired(session.startTime, duration)) {
        await applySessionExpirationPenalties(session);
        await session.save();
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info(`[SessionCleanup] Auto-closed ${expiredCount} expired participant sessions.`);
    }

    return expiredCount;
  } catch (err) {
    logger.error(`[SessionCleanup Error] ${err.message}`);
    return 0;
  }
};
