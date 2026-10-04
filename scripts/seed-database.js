/**
 * Master database initialization and seeding script.
 * Usage: 
 *   node scripts/seed-database.js              # Seeds only admin credentials from env
 *   node scripts/seed-database.js --challenges # Seeds admin + challenges
 */
const seedAdmin = require('../backend/src/seeds/seedAdmin');
const seedChallenges = require('../backend/src/seeds/seedChallenges');

async function seedDatabase() {
  console.log('[Seed] Initializing database seeding...');
  try {
    await seedAdmin();
    if (process.argv.includes('--challenges')) {
      console.log('[Seed] Seeding challenges as requested by --challenges flag...');
      await seedChallenges();
    }
    console.log('[Seed] Database initialization complete!');
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
