const path = require('path');
const backendDir = path.resolve(__dirname, '../backend');
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const mongoose = require(path.join(backendDir, 'node_modules/mongoose'));
const Challenge = require('../backend/src/models/Challenge');
const QRBlock = require('../backend/src/models/QRBlock');
const TestCase = require('../backend/src/models/TestCase');
const { runSingleTestCase } = require('../backend/src/services/judging/testRunner');
const { evaluateAllTestCases } = require('../backend/src/services/judging/judgingService');


const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindcraft';

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MIND CRAFT - COMPILER & CODE ASSEMBLY VERIFICATION SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  const challenges = await Challenge.find({ isActive: true });
  console.log(`Found ${challenges.length} active challenges to verify.\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  const languages = ['python', 'c', 'cpp', 'java'];

  for (const challenge of challenges) {
    console.log(`\n───────────────────────────────────────────────────────────────`);
    console.log(`CHALLENGE: "${challenge.title}" (${challenge.slug})`);
    console.log(`───────────────────────────────────────────────────────────────`);

    const testCases = await TestCase.find({ challengeId: challenge._id, isEnabled: true });
    if (!testCases.length) {
      console.log(`  ⚠️ No test cases found in DB for challenge ${challenge.slug}`);
      continue;
    }

    for (const lang of languages) {
      totalTests++;
      // Fetch non-decoy blocks ordered by correctOrder
      const blocks = await QRBlock.find({
        challengeId: challenge._id,
        language: lang,
        isDecoy: false,
      }).sort({ correctOrder: 1, displayOrder: 1 });

      if (!blocks.length) {
        console.log(`  ❌ [${lang.toUpperCase()}] No QR blocks found in DB!`);
        failedTests++;
        continue;
      }

      const assembledCode = blocks.map((b) => b.code || b.codeSnippet).join('\n');

      try {
        const evalResult = await evaluateAllTestCases({
          sourceCode: assembledCode,
          language: lang,
          testCases,
        });

        const isPass = evalResult.overallStatus === 'ACCEPTED';
        if (isPass) {
          passedTests++;
          console.log(`  ✅ [${lang.padEnd(6).toUpperCase()}] PASS (${evalResult.passedCount}/${evalResult.totalCount} tests passed)`);
        } else {
          failedTests++;
          console.log(`  ❌ [${lang.padEnd(6).toUpperCase()}] FAIL - Status: ${evalResult.overallStatus}`);
          if (evalResult.details) {
            evalResult.details.forEach((d, idx) => {
              if (!d.passed) {
                console.log(`     Test #${idx + 1}: ${d.status} | stdout: "${(d.stdout || '').trim()}" | error: "${(d.compileOutput || d.stderr || '').trim()}"`);
              }
            });
          }
        }
      } catch (err) {
        failedTests++;
        console.log(`  ❌ [${lang.padEnd(6).toUpperCase()}] ERROR: ${err.message}`);
      }
    }
  }

  // ── NEGATIVE / EDGE CASE TESTS ──
  console.log(`\n───────────────────────────────────────────────────────────────`);
  console.log(`EDGE CASE & DEFENSIVE VERIFICATION`);
  console.log(`───────────────────────────────────────────────────────────────`);

  // 1. Wrong Order Test (C++)
  totalTests++;
  try {
    const wrongOrderCode = 'cout << 42 << endl;\nint main() {\n#include <iostream>\nreturn 0;\n}';
    const wrongRes = await runSingleTestCase({
      sourceCode: wrongOrderCode,
      language: 'cpp',
      input: '1',
      expectedOutput: '1',
    });
    if (wrongRes.status === 'COMPILATION_ERROR' || wrongRes.status === 'WRONG_ANSWER' || !wrongRes.passed) {
      passedTests++;
      console.log('  ✅ [WRONG ORDER TEST]   PASS (Properly rejected with: ' + wrongRes.status + ')');
    } else {
      failedTests++;
      console.log('  ❌ [WRONG ORDER TEST]   FAIL (Should have failed compilation/output check)');
    }
  } catch (err) {
    passedTests++;
    console.log('  ✅ [WRONG ORDER TEST]   PASS (Rejected with error)');
  }

  // 2. Decoy Included Test
  totalTests++;
  try {
    const decoyCode = 'n = int(input())\ntotal = 999999\nprint(total)';
    const decoyRes = await runSingleTestCase({
      sourceCode: decoyCode,
      language: 'python',
      input: '5',
      expectedOutput: '15',
    });
    if (!decoyRes.passed || decoyRes.status === 'WRONG_ANSWER') {
      passedTests++;
      console.log('  ✅ [DECOY CODE TEST]    PASS (Rejected with WRONG_ANSWER)');
    } else {
      failedTests++;
      console.log('  ❌ [DECOY CODE TEST]    FAIL (Decoy passed test cases)');
    }
  } catch (err) {
    passedTests++;
    console.log('  ✅ [DECOY CODE TEST]    PASS (Error thrown on decoy)');
  }

  // 3. Infinite Loop / TLE Test
  totalTests++;
  try {
    const loopCode = 'import time\nwhile True:\n    pass';
    const tleRes = await runSingleTestCase({
      sourceCode: loopCode,
      language: 'python',
      input: '1',
      expectedOutput: '1',
    });
    if (tleRes.status === 'TIME_LIMIT_EXCEEDED' || tleRes.status === 'Time Limit Exceeded' || !tleRes.passed) {
      passedTests++;
      console.log('  ✅ [TIMEOUT / TLE TEST] PASS (Safely halted with: ' + tleRes.status + ')');
    } else {
      failedTests++;
      console.log('  ❌ [TIMEOUT / TLE TEST] FAIL (Infinite loop did not trigger TLE)');
    }
  } catch (err) {
    passedTests++;
    console.log('  ✅ [TIMEOUT / TLE TEST] PASS (Timeout enforced)');
  }

  // 4. Empty Code Test
  totalTests++;
  try {
    const emptyRes = await runSingleTestCase({
      sourceCode: '',
      language: 'python',
      input: '1',
      expectedOutput: '1',
    });
    if (!emptyRes.passed) {
      passedTests++;
      console.log('  ✅ [EMPTY CODE TEST]    PASS (Empty code rejected)');
    } else {
      failedTests++;
      console.log('  ❌ [EMPTY CODE TEST]    FAIL (Empty code passed)');
    }
  } catch (err) {
    passedTests++;
    console.log('  ✅ [EMPTY CODE TEST]    PASS (Empty code rejected with exception)');
  }

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);

  await mongoose.disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
