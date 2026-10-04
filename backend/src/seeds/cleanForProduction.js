/**
 * backend/src/seeds/cleanForProduction.js
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
const env = require('../config/env');
const User = require('../models/User');
const Submission = require('../models/Submission');
const ParticipantSession = require('../models/ParticipantSession');

async function cleanForProduction() {
  const mongoUri = env.MONGODB_URI || env.MONGO_URI;
  if (!mongoUri) {
    console.error('No MONGODB_URI found in backend configuration');
    process.exit(1);
  }

  console.log('[Clean] Connecting to MongoDB...');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

  // 1. Delete all non-admin users
  const adminEmail = (env.ADMIN_EMAIL || 'admin@mindcraft.io').trim().toLowerCase();
  const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' }, email: { $ne: adminEmail } });
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
  console.log(`- Participants remaining: ${await User.countDocuments({ role: { $ne: 'admin' } })}`);
  console.log(`- Submissions remaining:  ${await Submission.countDocuments()}`);
  console.log(`- Sessions remaining:     ${await ParticipantSession.countDocuments()}`);
  console.log('===========================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  cleanForProduction()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Clean Error]', err);
      process.exit(1);
    });
}

module.exports = cleanForProduction;
