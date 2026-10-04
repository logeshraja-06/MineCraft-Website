/**
 * CLI utility to generate printable QR code images for real challenge blocks from MongoDB.
 * Usage: node scripts/generate-qr.js <challengeIdOrSlug>
 */
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const env = require('../backend/src/config/env');
const Challenge = require('../backend/src/models/Challenge');
const QRBlock = require('../backend/src/models/QRBlock');

async function generateQRImages(challengeIdOrSlug) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }

    if (!challengeIdOrSlug) {
      console.error('Please specify a challenge ID or slug. Example: node scripts/generate-qr.js ch-01');
      return;
    }

    let challenge = null;
    if (/^[0-9a-fA-F]{24}$/.test(challengeIdOrSlug)) {
      challenge = await Challenge.findById(challengeIdOrSlug);
    }
    if (!challenge) {
      challenge = await Challenge.findOne({
        $or: [{ slug: challengeIdOrSlug }, { slug: String(challengeIdOrSlug).toLowerCase() }],
      });
    }

    if (!challenge) {
      console.error(`Challenge not found in database for '${challengeIdOrSlug}'`);
      return;
    }

    const cId = challenge._id;
    const blocks = await QRBlock.find({
      $or: [{ challengeId: cId }, { challengeId: challenge.slug }],
    }).sort({ correctOrder: 1, originalOrder: 1 });

    if (blocks.length === 0) {
      console.warn(`No QR blocks found in database for challenge: ${challenge.title} (${challenge.slug})`);
      return;
    }

    const outputDir = path.join(__dirname, '../dist-qr', challenge.slug);
    fs.mkdirSync(outputDir, { recursive: true });

    for (const block of blocks) {
      const token = block.qrToken || block.qrHash;
      const order = block.correctOrder || block.originalOrder || block.blockId;
      const filePath = path.join(outputDir, `block_${order}_${block.language || 'code'}.png`);
      await QRCode.toFile(filePath, token);
      console.log(`[QR Generator] Created QR for Block #${order} (${block.language}) -> ${filePath}`);
    }

    console.log(`[QR Generator] Generated ${blocks.length} real QR block images in ${outputDir}`);
  } catch (err) {
    console.error('[QR Generator Error]', err);
    throw err;
  } finally {
    if (require.main === module && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  generateQRImages(process.argv[2]);
}

module.exports = generateQRImages;
