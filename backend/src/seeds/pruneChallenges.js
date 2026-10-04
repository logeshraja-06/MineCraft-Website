/**
 * pruneChallenges.js
 *
 * Prunes all non-canonical challenges from the database, retaining EXACTLY:
 *   - ch-05 (Sequence 1, Easy)
 *   - ch-06 (Sequence 2, Medium)
 *   - ch-07 (Sequence 3, Hard)
 *
 * DRY-RUN by default: lists non-canonical challenges and related documents that WOULD be deleted.
 * To execute actual deletion, pass --confirm:
 *   node src/seeds/pruneChallenges.js --confirm
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (_) {}

const mongoose = require('mongoose');
const env = require('../config/env');
const Challenge = require('../models/Challenge');
const QRBlock = require('../models/QRBlock');
const TestCase = require('../models/TestCase');
const Submission = require('../models/Submission');
const ParticipantSession = require('../models/ParticipantSession');

const CANONICAL_SLUGS = ['ch-05', 'ch-06', 'ch-07'];

async function pruneChallenges() {
  const isConfirmed = process.argv.includes('--confirm');

  console.log('====================================================');
  console.log(`MIND CRAFT // CHALLENGE PRUNING UTILITY ${isConfirmed ? '[LIVE DELETION MODE]' : '[DRY-RUN MODE]'}`);
  console.log('====================================================\n');

  const mongoUri = env.MONGODB_URI || env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ Error: No MongoDB connection string found in environment.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });

  // 1. Verify that all 3 canonical challenges exist
  const canonicalChallenges = await Challenge.find({ slug: { $in: CANONICAL_SLUGS } }).lean();
  const foundSlugs = new Set(canonicalChallenges.map((c) => c.slug));
  const missingCanonical = CANONICAL_SLUGS.filter((s) => !foundSlugs.has(s));

  if (missingCanonical.length > 0) {
    console.error(
      `❌ Safety Abort: Missing canonical challenge(s): ${missingCanonical.join(', ')}.\n` +
      `   Please seed the canonical challenges first by running:\n` +
      `   npm run seed:challenges\n`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`✓ All 3 canonical challenges verified:`);
  canonicalChallenges.forEach((c) => {
    console.log(`   - [Seq ${c.sequenceOrder || '?'}] ${c.slug}: "${c.title}"`);
  });
  console.log('');

  // 2. Identify all non-canonical challenges
  const nonCanonicalChallenges = await Challenge.find({
    slug: { $nin: CANONICAL_SLUGS },
  }).lean();

  if (nonCanonicalChallenges.length === 0) {
    console.log('✓ Database is already clean! No non-canonical challenges found.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${nonCanonicalChallenges.length} non-canonical challenge(s) to prune:\n`);

  let totalQRBlocks = 0;
  let totalTestCases = 0;
  let totalSubmissions = 0;
  let totalSessions = 0;

  const challengeDetails = [];

  for (const c of nonCanonicalChallenges) {
    const idVariants = [c._id, String(c._id)];
    if (c.slug) {
      idVariants.push(c.slug, String(c.slug).toLowerCase());
    }

    const query = { challengeId: { $in: idVariants } };

    const [qrCount, tcCount, subCount, sessCount] = await Promise.all([
      QRBlock.countDocuments(query),
      TestCase.countDocuments(query),
      Submission.countDocuments(query),
      ParticipantSession.countDocuments(query),
    ]);

    totalQRBlocks += qrCount;
    totalTestCases += tcCount;
    totalSubmissions += subCount;
    totalSessions += sessCount;

    challengeDetails.push({
      challenge: c,
      query,
      counts: { qrCount, tcCount, subCount, sessCount },
    });

    console.log(`• Challenge: "${c.title}" (${c.slug || c._id})`);
    console.log(`  - QRBlocks:             ${qrCount}`);
    console.log(`  - TestCases:            ${tcCount}`);
    console.log(`  - Submissions:          ${subCount}`);
    console.log(`  - ParticipantSessions:  ${sessCount}`);
    console.log('');
  }

  console.log('----------------------------------------------------');
  console.log('TOTAL IMPACT SUMMARY:');
  console.log(`  - Challenges to remove:   ${nonCanonicalChallenges.length}`);
  console.log(`  - QR Blocks to delete:    ${totalQRBlocks}`);
  console.log(`  - Test Cases to delete:   ${totalTestCases}`);
  console.log(`  - Submissions to delete:  ${totalSubmissions}`);
  console.log(`  - Sessions to delete:     ${totalSessions}`);
  console.log(`  - Users affected:         0 (Users are NEVER deleted)`);
  console.log('----------------------------------------------------\n');

  if (!isConfirmed) {
    console.log('ℹ️  DRY-RUN COMPLETE: No data was modified or deleted.');
    console.log('   To execute actual deletion, run:');
    console.log('   npm run prune:challenges -- --confirm\n');
    await mongoose.disconnect();
    return;
  }

  // 3. Perform actual deletion when --confirm is present
  console.log('🚨 EXECUTING DELETION (--confirm flag detected)...');

  for (const item of challengeDetails) {
    const { challenge, query } = item;
    await Promise.all([
      Challenge.deleteOne({ _id: challenge._id }),
      QRBlock.deleteMany(query),
      TestCase.deleteMany(query),
      Submission.deleteMany(query),
      ParticipantSession.deleteMany(query),
    ]);
    console.log(`✓ Deleted "${challenge.title}" (${challenge.slug}) and associated records.`);
  }

  console.log('\n====================================================');
  console.log('✓ PRUNING COMPLETED SUCCESSFULLY!');
  console.log(`Exactly 3 canonical challenges remain in the database.`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  pruneChallenges()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Pruning Error:', err);
      process.exit(1);
    });
}

module.exports = pruneChallenges;
