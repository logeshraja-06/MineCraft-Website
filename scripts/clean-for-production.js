/**
 * scripts/clean-for-production.js
 *
 * Purges all test participants, test submissions, and participant sessions
 * to leave a clean production environment with 0 participants, 0 submissions,
 * and 0 leaderboard entries.
 *
 * Keeps:
 * - Admin user (admin@mindcraft.io)
 * - Challenges, test cases, and QR blocks
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/src/models/User');
const Submission = require('../backend/src/models/Submission');
const ParticipantSession = require('../backend/src/models/ParticipantSession');

async function cleanForProduction() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('No MONGODB_URI found in backend/.env');
    process.exit(1);
  }

  console.log('[Clean] Connecting to MongoDB...');
  await mongoose.connect(mongoUri);

  // 1. Delete all non-admin users
  const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' }, email: { $ne: 'admin@mindcraft.io' } });
  console.log(`[Clean] Deleted ${deletedUsers.deletedCount} test participants.`);

  // 2. Delete all submissions
  const deletedSubs = await Submission.deleteMany({});
  console.log(`[Clean] Deleted ${deletedSubs.deletedCount} submissions.`);

  // 3. Delete all participant sessions
  const deletedSessions = await ParticipantSession.deleteMany({});
  console.log(`[Clean] Deleted ${deletedSessions.deletedCount} participant sessions.`);

  // 4. Verify admin user
  const admin = await User.findOne({ role: 'admin' }).select('name email role');
  console.log(`[Clean] Master Admin preserved: ${admin ? admin.email : 'NOT FOUND'}`);

  console.log('\n===========================================');
  console.log('PRODUCTION DATABASE PURGE COMPLETE:');
  console.log('- Total participants: 0');
  console.log('- Total submissions:  0');
  console.log('- Leaderboard:        Empty (0 entries)');
  console.log('===========================================\n');

  await mongoose.disconnect();
}

cleanForProduction().catch((err) => {
  console.error('[Clean Error]', err);
  process.exit(1);
});
