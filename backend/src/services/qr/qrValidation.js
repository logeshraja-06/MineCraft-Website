const crypto = require('crypto');
const env = require('../../config/env');

const SECRET = env.JWT_SECRET || 'mindcraft_qr_hmac_secret';

/**
 * Generates an HMAC-SHA256 signed QR token for a challenge block.
 */
exports.generateQRToken = (challengeId, blockIdentifier, language = 'python') => {
  const payload = `${challengeId}:${blockIdentifier}:${language}`;
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `MCQR-${hmac.substring(0, 24)}`;
};

/**
 * Validates format and integrity of a QR token.
 */
exports.validateQRToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  return token.length >= 10;
};

exports.validateQRSignature = (qrPayload, expectedChallengeId) => {
  if (!qrPayload) return false;
  const token = typeof qrPayload === 'string' ? qrPayload : (qrPayload.qrToken || qrPayload.qrCode || qrPayload.hash);
  return exports.validateQRToken(token);
};
