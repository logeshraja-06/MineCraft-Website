const asyncHandler = require('../utils/asyncHandler');
const QRBlock = require('../models/QRBlock');
const Challenge = require('../models/Challenge');
const ParticipantSession = require('../models/ParticipantSession');
const { checkIfSessionExpired } = require('../services/session/timerService');
const { validateQRToken } = require('../services/qr/qrValidation');
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

function sanitizeBlock(block) {
  const b = block.toObject ? block.toObject() : { ...block };
  // Never expose correctOrder or isDecoy to the participant client
  delete b.correctOrder;
  delete b.originalOrder;
  delete b.orderHint;
  delete b.isDecoy;

  // Clean any explicit decoy markers in code comments
  if (typeof b.code === 'string') {
    b.code = b.code.replace(/#\s*DECOY[^\n]*/gi, '').replace(/\/\/\s*DECOY[^\n]*/gi, '');
  }
  if (typeof b.codeSnippet === 'string') {
    b.codeSnippet = b.codeSnippet.replace(/#\s*DECOY[^\n]*/gi, '').replace(/\/\/\s*DECOY[^\n]*/gi, '');
  }

  return {
    _id: b._id,
    blockId: b.blockId || `B-${String(b._id).slice(-4).toUpperCase()}`,
    title: b.title || `Block #${b.displayOrder || 1}`,
    language: b.language,
    code: b.code || b.codeSnippet,
    type: b.type || b.blockType || 'LOGIC',
    qrToken: b.qrToken || b.qrHash,
  };
}

exports.scanBlock = asyncHandler(async (req, res) => {
  const { qrCode, challengeId } = req.body || {};

  if (!qrCode) {
    return res.status(400).json({ success: false, message: 'QR code token is required' });
  }

  if (!validateQRToken(qrCode)) {
    return res.status(400).json({ success: false, message: 'Malformed QR code token' });
  }

  let challenge = null;
  if (challengeId) {
    challenge = await findChallenge(challengeId);
    if (challenge && !(await checkChallengeLock(req, res, challenge))) {
      return;
    }
  }

  // 1. Look up block in DB
  const blockQuery = {
    $or: [{ qrToken: qrCode }, { qrHash: qrCode }],
  };
  if (challenge) {
    blockQuery.$and = [
      { $or: [{ qrToken: qrCode }, { qrHash: qrCode }] },
      { $or: [{ challengeId: challenge._id }, { challengeId: challenge.slug }] },
    ];
  }

  const block = await QRBlock.findOne(blockQuery);
  if (!block) {
    return res.status(404).json({ success: false, message: 'Invalid or unknown QR code token' });
  }

  if (!challenge && block.challengeId) {
    challenge = await findChallenge(block.challengeId);
    if (challenge && !(await checkChallengeLock(req, res, challenge))) {
      return;
    }
  }

  const targetChallengeId = challenge ? challenge._id : block.challengeId;

  // 2. Look up or initialize participant session
  let session = await ParticipantSession.findOne({
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
      message: 'Challenge time has expired. QR scanning is disabled.',
      isExpired: true,
    });
  }

  const sanitized = sanitizeBlock(block);

  // 3. Record in session if active
  if (session) {
    const alreadyScanned = (session.scannedBlocks || []).some(
      (sb) => String(sb._id || sb.blockId || sb) === String(sanitized._id) || String(sb.qrToken || sb) === String(sanitized.qrToken)
    );

    if (!alreadyScanned) {
      session.scannedBlocks.push(sanitized);
      session.revealsCount = (session.revealsCount || 0) + 1;
      session.lastActivityAt = new Date();
      await session.save();
    }
  }

  res.json({
    success: true,
    message: 'Block successfully scanned and unlocked!',
    block: sanitized,
  });
});

exports.getScannedBlocks = asyncHandler(async (req, res) => {
  const challenge = await findChallenge(req.params.challengeId);
  const targetId = challenge ? challenge._id : req.params.challengeId;

  const session = await ParticipantSession.findOne({
    userId: req.user._id,
    challengeId: targetId,
  });

  const blocks = (session?.scannedBlocks || []).map((b) => (b.toObject ? sanitizeBlock(b) : b));
  res.json({ success: true, blocks });
});
