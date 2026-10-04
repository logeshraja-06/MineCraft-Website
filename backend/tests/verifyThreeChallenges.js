const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

console.warn('\n⚠️ ========================================================');
console.warn('⚠️ WARNING: verifyThreeChallenges.js checks a LIVE server!');
console.warn('⚠️ ONLY execute this script against a LOCAL/DEV database.');
console.warn('⚠️ ========================================================\n');

async function verifyThreeChallenges() {
  console.log('--- VERIFYING 3 CANONICAL CHALLENGES (ch-05, ch-06, ch-07) ---');

  // 1. Get all public challenges
  const res = await axios.get(`${BASE_URL}/challenges`);
  const challenges = res.data.challenges;
  console.log(`Retrieved ${challenges.length} participant-facing challenges.`);

  const expectedSlugs = ['ch-05', 'ch-06', 'ch-07'];

  if (challenges.length !== 3) {
    throw new Error(`Expected exactly 3 participant-facing challenges, but received ${challenges.length}!`);
  }

  for (let i = 0; i < expectedSlugs.length; i++) {
    const slug = expectedSlugs[i];
    const ch = challenges.find((c) => c.slug === slug);
    if (!ch) {
      throw new Error(`Missing expected canonical challenge: "${slug}"!`);
    }

    const expectedOrder = i + 1;
    if (ch.sequenceOrder !== expectedOrder) {
      throw new Error(`Challenge ${slug} has sequenceOrder ${ch.sequenceOrder}, expected ${expectedOrder}!`);
    }

    console.log(`\n======================================================`);
    console.log(`CANONICAL #${ch.sequenceOrder}: "${ch.title}" (${ch.slug})`);
    console.log(`  - Difficulty: ${ch.difficulty}`);
    console.log(`  - Sequence Order: ${ch.sequenceOrder}`);
    console.log(`  - Points: ${ch.points}`);
    console.log(`  - Tasks Count: ${ch.tasks?.length || ch.tasksCount || 0}`);

    // Check that source code is NOT leaked
    const detailRes = await axios.get(`${BASE_URL}/challenges/${ch.slug || ch._id}`);
    if (detailRes.data.challenge.sourceCode) {
      throw new Error(`SECURITY VIOLATION: Source code leaked for ${slug}!`);
    }

    const quizPool = detailRes.data.challenge.tasks?.[0]?.quizPool || [];
    if (quizPool.length > 0) {
      if (quizPool[0].answer !== undefined || quizPool[0].explain !== undefined) {
        throw new Error(`SECURITY VIOLATION: Quiz answer/explanation leaked for ${slug}!`);
      }
    }
  }

  console.log('\n--- ALL 3 CANONICAL CHALLENGES VERIFIED WITH ZERO LEAKS! ---');
}

verifyThreeChallenges().catch((err) => {
  console.error('❌ Verification failed:', err.response?.data || err.message);
  process.exit(1);
});
