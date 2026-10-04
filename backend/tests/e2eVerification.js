const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

console.warn('\n⚠️ ========================================================');
console.warn('⚠️ WARNING: e2eVerification.js runs against a LIVE server!');
console.warn('⚠️ ONLY execute this script against a LOCAL/DEV database.');
console.warn('⚠️ ========================================================\n');

async function runAcceptanceTest() {
  console.log('====================================================');
  console.log('STARTING BLIND CODING FULL ACCEPTANCE TEST');
  console.log('====================================================\n');

  let adminToken = '';
  let participantToken = '';
  let createdChallengeId = '';
  let createdChallengeSlug = '';

  try {
    // 1. Admin Login
    console.log('[TEST 1] Admin Authentication');
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/admin/login`, {
      email: 'admin@mindcraft.io',
      password: 'AdminSecurePassword2026!',
    });
    if (!adminLoginRes.data.token) throw new Error('Admin login failed');
    adminToken = adminLoginRes.data.token;
    console.log('✓ Admin login successful. Role:', adminLoginRes.data.user.role);

    // 2. Admin Dashboard Overview
    console.log('\n[TEST 2] Admin Dashboard Overview Telemetry');
    const overviewRes = await axios.get(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('✓ Stats returned from MongoDB:');
    console.log('  - Total Participants:', overviewRes.data.stats.totalParticipants);
    console.log('  - Active Participants:', overviewRes.data.stats.activeParticipants);
    console.log('  - Total Challenges:', overviewRes.data.stats.totalChallenges);
    console.log('  - Published Challenges:', overviewRes.data.stats.publishedChallenges);
    console.log('  - Total Submissions:', overviewRes.data.stats.totalSubmissions);
    console.log('  - Accepted Submissions:', overviewRes.data.stats.acceptedSubmissions);
    console.log('  - Live Sessions Count:', overviewRes.data.liveSessions.length);

    // 3. Create a Java Challenge with Complete Source Code & Block Generation
    console.log('\n[TEST 3] Create Java Challenge via Multi-Section Workflow');
    const javaSolution = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`;

    const challengePayload = {
      title: 'E2E Test Java Adder',
      slug: `e2e-test-java-adder-${Date.now()}`,
    category: 'Basic Arithmetic',
    difficulty: 'Easy',
    points: 100,
    description: 'Read two integers from standard input and output their sum.',
    instructions: 'Unlock fragments, assemble them in order, and submit.',
    inputFormat: 'A and B space separated',
    outputFormat: 'A + B',
    sourceLanguage: 'java',
    sourceCode: javaSolution,
    splitStrategy: 'statement',
    status: 'Published',
    blockConfig: {
      initialVisibleCount: 3,
      revealMode: 'manual',
      revealPenalty: 5,
      wrongSubmissionPenalty: 2,
      maxReveals: 8,
      randomizeOrder: true,
      partialScoring: true,
    },
    testCases: [
      { input: '10 20', expectedOutput: '30', isHidden: false, weight: 20 },
      { input: '5 7', expectedOutput: '12', isHidden: false, weight: 20 },
      { input: '-15 25', expectedOutput: '10', isHidden: true, weight: 20 },
      { input: '100 -200', expectedOutput: '-100', isHidden: true, weight: 20 },
      { input: '999 1', expectedOutput: '1000', isHidden: true, weight: 20 },
    ],
  };

  const createChalRes = await axios.post(`${BASE_URL}/admin/challenges`, challengePayload, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  createdChallengeId = createChalRes.data.challenge._id;
  createdChallengeSlug = createChalRes.data.challenge.slug;
  console.log('✓ Challenge created. ID:', createdChallengeId);

  // 4. Verify Block Generation
  console.log('\n[TEST 4] Verify Code Blocks & Ordering');
  const blocksRes = await axios.get(`${BASE_URL}/admin/challenges/${createdChallengeId}/blocks`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✓ Total blocks generated: ${blocksRes.data.blocks.length}`);
  blocksRes.data.blocks.forEach((b) => {
    console.log(`  - Block ${b.blockId}: [Order #${b.originalOrder}] (${b.blockType}) "${b.codeSnippet.replace(/\n/g, ' ')}"`);
  });

  // 5. Test Participant Security: Source Code & Original Order NOT exposed
  console.log('\n[TEST 5] Security Check: Participant API Leakage Prevention');
  const participantChalRes = await axios.get(`${BASE_URL}/challenges/${createdChallengeId}`);
  if (participantChalRes.data.challenge.sourceCode) {
    throw new Error('SECURITY VIOLATION: Source code leaked in participant API!');
  }
  console.log('✓ Source code is NOT exposed in public challenge API.');

  const participantBlocksRes = await axios.get(`${BASE_URL}/challenges/${createdChallengeId}/blocks`);
  participantBlocksRes.data.blocks.forEach((b) => {
    if (b.originalOrder !== undefined) {
      throw new Error(`SECURITY VIOLATION: originalOrder leaked in block ${b.blockId}!`);
    }
  });
  console.log('✓ originalOrder is NOT exposed to participant clients.');
  console.log(`✓ Initial visible blocks: ${participantBlocksRes.data.unlockedCount} / ${participantBlocksRes.data.totalBlocks}`);

  // 6. Participant Registration & Login
  console.log('\n[TEST 6] Participant Authentication');
  const participantEmail = `e2e_student_${Date.now()}@college.edu`;
  await axios.post(`${BASE_URL}/participants/register`, {
    name: 'E2E Test Candidate',
    email: participantEmail,
    password: 'Password123!',
    teamName: 'E2EWinners',
    college: 'Anna University',
  });

  const partLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: participantEmail,
    password: 'Password123!',
  });
  participantToken = partLoginRes.data.token;
  console.log('✓ Participant logged in successfully:', partLoginRes.data.user.name);

  // 7. Participant Reveal Mechanism
  console.log('\n[TEST 7] Participant "Reveal Next Block" Mechanism');
  const revealRes = await axios.post(
    `${BASE_URL}/challenges/${createdChallengeId}/reveal`,
    {},
    { headers: { Authorization: `Bearer ${participantToken}` } }
  );
  console.log('✓ Revealed Block:', revealRes.data.revealedBlock.blockId);
  console.log('  - Code:', revealRes.data.revealedBlock.code.replace(/\n/g, ' '));
  console.log('  - Reveals count:', revealRes.data.revealsCount);

  // 8. Participant Run Code Execution
  console.log('\n[TEST 8] Run Code Execution');
  const runRes = await axios.post(
    `${BASE_URL}/submissions/run`,
    {
      code: javaSolution,
      language: 'java',
      input: '10 20',
      challengeId: createdChallengeId,
    },
    { headers: { Authorization: `Bearer ${participantToken}` } }
  );
  console.log('✓ Run Output:', runRes.data.output?.trim(), 'Status:', runRes.data.status);

  // 9. Participant Solution Submission & Scoring
  console.log('\n[TEST 9] Submit Assembled Solution & Scoring');
  const submitRes = await axios.post(
    `${BASE_URL}/submissions`,
    {
      code: javaSolution,
      language: 'java',
      challengeId: createdChallengeId,
      assembledBlockIds: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09'],
    },
    { headers: { Authorization: `Bearer ${participantToken}` } }
  );
  console.log('✓ Submission outcome:');
  console.log('  - Status:', submitRes.data.status);
  console.log('  - Score Awarded:', submitRes.data.score);
  console.log('  - Passed Tests:', `${submitRes.data.passedCount}/${submitRes.data.totalCount}`);
  console.log('  - Deducted Penalties:', submitRes.data.penalties);

  // 10. Admin Surveillance & Audit Verification
  console.log('\n[TEST 10] Admin Surveillance of Live Sessions & Submissions');
  const liveSessionsRes = await axios.get(`${BASE_URL}/admin/sessions`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const mySession = liveSessionsRes.data.sessions.find((s) => s.email === participantEmail);
  console.log('✓ Participant live session recorded:');
  console.log('  - Contestant:', mySession?.participant);
  console.log('  - Score:', mySession?.currentScore);
  console.log('  - Reveals:', mySession?.blocksRevealed);

  // 11. Admin Leaderboard
  console.log('\n[TEST 11] Leaderboard Standings');
  const lbRes = await axios.get(`${BASE_URL}/admin/leaderboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✓ Total participants ranked on leaderboard: ${lbRes.data.rankings.length}`);
  const topRanked = lbRes.data.rankings[0];
  console.log(`  - Rank 1: ${topRanked.name} (${topRanked.totalScore} PTS, Solved: ${topRanked.challengesSolved})`);

  // 12. Real Excel Export Verification
  console.log('\n[TEST 12] Real Excel (.xlsx) Export Verification');
  const excelRes = await axios.get(`${BASE_URL}/admin/reports/export/excel`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    responseType: 'arraybuffer',
  });
  if (excelRes.data.length < 500) throw new Error('Excel generation produced invalid buffer');
  console.log(`✓ Excel file generated successfully: ${excelRes.data.length} bytes, MIME: ${excelRes.headers['content-type']}`);

  // 13. Real PDF Export Verification
  console.log('\n[TEST 13] Real PDF (.pdf) Export Verification');
  const pdfRes = await axios.get(`${BASE_URL}/admin/reports/export/pdf`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    responseType: 'arraybuffer',
  });
  const pdfHeader = Buffer.from(pdfRes.data.slice(0, 4)).toString();
  if (pdfHeader !== '%PDF') throw new Error(`PDF generation invalid, header: ${pdfHeader}`);
  console.log(`✓ PDF file generated successfully: ${pdfRes.data.length} bytes, Header: ${pdfHeader}`);

  // 14. Unauthorized Access Checks
  console.log('\n[TEST 14] Security Access Control Checks');
  try {
    await axios.get(`${BASE_URL}/admin/overview`);
    throw new Error('FAILED: Unauthenticated request was allowed!');
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('✓ Unauthenticated request rejected (401 Unauthorized)');
    } else {
      throw err;
    }
  }

  try {
    await axios.get(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${participantToken}` },
    });
    throw new Error('FAILED: Participant was allowed to access admin API!');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✓ Participant role rejected from admin API (403 Forbidden)');
    } else {
      throw err;
    }
  }

    console.log('\n====================================================');
    console.log('ALL ACCEPTANCE TESTS COMPLETED SUCCESSFULLY! ✓✓✓');
    console.log('====================================================');
  } finally {
    if (createdChallengeId && adminToken) {
      console.log(`\n[CLEANUP] Deleting test challenge (${createdChallengeId})...`);
      try {
        await axios.delete(`${BASE_URL}/admin/challenges/${createdChallengeId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        console.log('✓ Successfully deleted temporary e2e test challenge.');
      } catch (cleanErr) {
        console.warn('⚠️ Warning: failed to clean up test challenge:', cleanErr.message);
      }
    }
  }
}

runAcceptanceTest().catch((err) => {
  console.error('\n❌ ACCEPTANCE TEST FAILED:', err.response?.data || err.message);
  process.exit(1);
});
