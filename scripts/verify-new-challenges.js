const path = require('path');
const backendDir = path.resolve(__dirname, '../backend');
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const { CHALLENGES_DATA } = require('../backend/src/seeds/seedChallenges');
const { evaluateAllTestCases } = require('../backend/src/services/judging/judgingService');

const TARGET_SLUGS = ['ch-05', 'ch-06', 'ch-07'];
const REQUIRED_LANGS = ['python', 'java', 'cpp', 'c'];

async function runVerification() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MIND CRAFT - CHALLENGE STRUCTURAL & COMPILER VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let totalStructuralChecks = 0;
  let passedStructuralChecks = 0;
  let totalJudgeTests = 0;
  let passedJudgeTests = 0;
  let hasFailure = false;

  for (const slug of TARGET_SLUGS) {
    const cd = CHALLENGES_DATA.find((c) => c.slug === slug);
    if (!cd) {
      console.error(`❌ Missing challenge: ${slug} in CHALLENGES_DATA`);
      hasFailure = true;
      continue;
    }

    console.log(`───────────────────────────────────────────────────────────────`);
    console.log(`CHALLENGE: "${cd.title}" (${cd.slug}) [${cd.difficulty}]`);
    console.log(`───────────────────────────────────────────────────────────────`);

    // ── 1. STRUCTURAL INTEGRITY CHECKS ──
    console.log(`  [Structural Checks]`);

    // a) Language configs present for all required languages
    const langConfigs = cd.languageConfigs || [];
    const configMap = {};
    langConfigs.forEach((lc) => { configMap[lc.language] = lc; });

    let structuralOk = true;

    // Check all required languages present
    totalStructuralChecks++;
    const missingLangs = REQUIRED_LANGS.filter((l) => !configMap[l]);
    if (missingLangs.length > 0) {
      console.error(`    ❌ Missing language configs for: ${missingLangs.join(', ')}`);
      structuralOk = false;
    } else {
      passedStructuralChecks++;
      console.log(`    ✅ All 4 languages defined (python, java, cpp, c)`);
    }

    // b) Equal block counts across all 4 languages
    totalStructuralChecks++;
    const blockCounts = REQUIRED_LANGS.map((l) => configMap[l]?.blocks?.length || 0);
    const targetBlockCount = blockCounts[0];
    const allCountsEqual = blockCounts.every((count) => count === targetBlockCount && count > 0);
    if (!allCountsEqual) {
      console.error(`    ❌ Block counts differ across languages:`, REQUIRED_LANGS.map((l, i) => `${l}: ${blockCounts[i]}`));
      structuralOk = false;
    } else {
      passedStructuralChecks++;
      console.log(`    ✅ Equal block count across all languages: ${targetBlockCount} blocks`);
    }

    // c) tasks.length === block count
    totalStructuralChecks++;
    const tasks = cd.tasks || [];
    if (tasks.length !== targetBlockCount) {
      console.error(`    ❌ Task count (${tasks.length}) does not match block count (${targetBlockCount})`);
      structuralOk = false;
    } else {
      passedStructuralChecks++;
      console.log(`    ✅ Task count (${tasks.length}) matches block count (${targetBlockCount})`);
    }

    // d) Each task has rewards for all 4 languages & no duplicate reward blockIds
    totalStructuralChecks++;
    const rewardIdsPerLang = { python: new Set(), java: new Set(), cpp: new Set(), c: new Set() };
    let rewardsValid = true;

    tasks.forEach((t, tIdx) => {
      REQUIRED_LANGS.forEach((l) => {
        const blockId = t.rewards?.[l];
        if (!blockId) {
          console.error(`    ❌ Task ${tIdx + 1} (${t.taskId}) missing reward for ${l}`);
          rewardsValid = false;
        } else {
          if (rewardIdsPerLang[l].has(blockId)) {
            console.error(`    ❌ Task ${tIdx + 1} duplicates reward blockId ${blockId} for ${l}`);
            rewardsValid = false;
          }
          rewardIdsPerLang[l].add(blockId);
        }
      });
    });

    if (rewardsValid) {
      passedStructuralChecks++;
      console.log(`    ✅ 1:1 Task-to-Block reward mapping verified with no duplicates`);
    } else {
      structuralOk = false;
    }

    // e) Every quiz has type, prompt, answer, explain, concept
    totalStructuralChecks++;
    let quizzesValid = true;
    tasks.forEach((t, tIdx) => {
      if (!t.quizPool || t.quizPool.length < 2) {
        console.error(`    ❌ Task ${tIdx + 1} has ${t.quizPool?.length || 0} quizzes (expected at least 2)`);
        quizzesValid = false;
      }
      (t.quizPool || []).forEach((q, qIdx) => {
        if (!q.quizId || !q.type || !q.prompt || q.answer === undefined || q.answer === null || q.answer === '') {
          console.error(`    ❌ Task ${tIdx + 1} quiz ${qIdx + 1} (${q.quizId}) missing required fields`);
          quizzesValid = false;
        }
        if (!q.explain) {
          console.error(`    ❌ Task ${tIdx + 1} quiz ${qIdx + 1} (${q.quizId}) missing explain`);
          quizzesValid = false;
        }
        if (!q.concept) {
          console.error(`    ❌ Task ${tIdx + 1} quiz ${qIdx + 1} (${q.quizId}) missing concept`);
          quizzesValid = false;
        }
      });
    });

    if (quizzesValid) {
      passedStructuralChecks++;
      console.log(`    ✅ Quiz pools verified (${tasks.reduce((sum, t) => sum + t.quizPool.length, 0)} total quizzes with valid answer, explain, concept)`);
    } else {
      structuralOk = false;
    }

    if (!structuralOk) {
      hasFailure = true;
    }

    // ── 2. COMPILER & TEST CASE EVALUATION ──
    console.log(`  [Compiler & Hidden Tests Evaluation]`);
    const hiddenTests = cd.hiddenTests || [];
    if (hiddenTests.length === 0) {
      console.error(`    ❌ No hiddenTests found for challenge ${cd.slug}`);
      hasFailure = true;
      continue;
    }

    for (const lang of REQUIRED_LANGS) {
      totalJudgeTests++;
      const lc = configMap[lang];
      const sortedBlocks = [...(lc.blocks || [])].sort((a, b) => a.order - b.order);
      const assembledCode = sortedBlocks.map((b) => b.code).join('\n');

      const testCases = hiddenTests.map((t, idx) => ({
        _id: `${cd.slug}-${lang}-${idx + 1}`,
        input: t.input,
        expectedOutput: t.expectedOutput,
      }));

      try {
        const evalResult = await evaluateAllTestCases({
          sourceCode: assembledCode,
          language: lang,
          testCases,
        });

        if (evalResult.overallStatus === 'ACCEPTED') {
          passedJudgeTests++;
          console.log(`    ✅ [${lang.padEnd(6).toUpperCase()}] PASS (${evalResult.passedCount}/${evalResult.totalCount} tests passed)`);
        } else {
          hasFailure = true;
          console.error(`    ❌ [${lang.padEnd(6).toUpperCase()}] FAIL - Status: ${evalResult.overallStatus}`);
          if (evalResult.details) {
            evalResult.details.forEach((d, idx) => {
              if (!d.passed) {
                console.error(`       Test #${idx + 1}: ${d.status} | input: "${testCases[idx].input.trim()}" | expected: "${testCases[idx].expectedOutput.trim()}" | got: "${(d.stdout || '').trim()}" | err: "${(d.compileOutput || d.stderr || '').trim()}"`);
              }
            });
          }
        }
      } catch (err) {
        hasFailure = true;
        console.error(`    ❌ [${lang.padEnd(6).toUpperCase()}] ERROR: ${err.message}`);
      }
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`VERIFICATION SUMMARY:`);
  console.log(`  Structural Checks: ${passedStructuralChecks}/${totalStructuralChecks} passed`);
  console.log(`  Compiler Tests:    ${passedJudgeTests}/${totalJudgeTests} passed`);
  console.log(`  Final Result:      ${hasFailure ? '❌ SOME CHECKS FAILED' : '✅ ALL CHECKS PASSED'}`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);

  if (hasFailure) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error in verify-new-challenges:', err);
  process.exit(1);
});
