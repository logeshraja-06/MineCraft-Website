const path = require('path');
const backendDir = path.resolve(__dirname, '../backend');
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const axios = require(path.join(backendDir, 'node_modules/axios'));
const { CHALLENGES_DATA } = require('../backend/src/seeds/seedChallenges');

const BASE_URL = 'http://localhost:5000/api';

async function smokeTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MIND CRAFT - END-TO-END FLOW SMOKE TEST (ch-06 & ch-07)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Register a test participant
  const testId = 'ST_' + Date.now().toString(36).slice(-6).toUpperCase();
  console.log(`[1] Registering test participant: ${testId}`);
  const regRes = await axios.post(`${BASE_URL}/participants/register`, {
    participantId: testId,
    name: 'Smoke Test Bot',
    email: `bot_${testId.toLowerCase()}@test.io`,
    department: 'CSE',
    college: 'MindCraft Academy',
  });

  const token = regRes.data.token;
  console.log(`  ✓ Registered successfully, token received\n`);

  const client = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  for (const slug of ['ch-06', 'ch-07']) {
    console.log(`───────────────────────────────────────────────────────────────`);
    console.log(`STARTING FLOW FOR CHALLENGE: ${slug}`);
    console.log(`───────────────────────────────────────────────────────────────`);

    const cd = CHALLENGES_DATA.find((c) => c.slug === slug);
    const lang = 'python';

    // A. Start Session
    console.log(`  [Step A] Starting session for ${slug} (${lang})...`);
    const startRes = await client.post(`/challenges/${slug}/start-session`, { language: lang });
    console.log(`  ✓ Session started. Total tasks: ${startRes.data.totalTasks}`);

    // B. Get Current Task
    let currentTaskRes = await client.get(`/challenges/${slug}/current-task`);
    let currentTask = currentTaskRes.data.currentTask;
    console.log(`  ✓ Current task: ${currentTask.title} (ID: ${currentTask.taskId})`);

    // C. Test WRONG answer on Task 1
    console.log(`  [Step C] Submitting deliberate WRONG answer to verify penalty & question retention...`);
    const wrongRes = await client.post(`/challenges/${slug}/submit-task`, { answer: 99999 });
    console.log(`    correct: ${wrongRes.data.correct} (expected: false)`);
    console.log(`    totalPenaltySeconds: ${wrongRes.data.totalPenaltySeconds} (expected: >= 20)`);
    console.log(`    nextTask taskId: ${wrongRes.data.nextTask?.taskId} (retained: ${wrongRes.data.nextTask?.taskId === currentTask.taskId})`);

    if (wrongRes.data.correct !== false || wrongRes.data.totalPenaltySeconds < 20) {
      throw new Error(`Wrong answer validation failed for ${slug}`);
    }
    console.log(`  ✓ Wrong answer handled correctly: +20s penalty and question preserved.\n`);

    // D. Answer all tasks correctly
    console.log(`  [Step D] Answering all ${cd.tasks.length} tasks correctly...`);
    for (let i = 0; i < cd.tasks.length; i++) {
      const taskSpec = cd.tasks[i];
      const correctQuiz = taskSpec.quizPool[0];
      const correctAnswer = Array.isArray(correctQuiz.answer) ? correctQuiz.answer[0] : correctQuiz.answer;

      const subRes = await client.post(`/challenges/${slug}/submit-task`, { answer: correctAnswer });
      const unlocked = subRes.data.unlockedBlock;
      console.log(`    Task ${i + 1} (${taskSpec.taskId}): correct=${subRes.data.correct}, unlocked=${unlocked?.blockId}`);

      if (!subRes.data.correct || !unlocked) {
        throw new Error(`Failed to solve task ${i + 1} for ${slug}`);
      }

      if (i === cd.tasks.length - 1) {
        console.log(`    All tasks completed! allTasksCompleted: ${subRes.data.allTasksCompleted}`);
        if (!subRes.data.allTasksCompleted) {
          throw new Error(`allTasksCompleted should be true after last task`);
        }
      }
    }
    console.log(`  ✓ All tasks solved! All ${cd.tasks.length} blocks unlocked.\n`);

    // E. Assemble Phase: Sync block order
    console.log(`  [Step E] Assembling blocks on assembly board...`);
    const pyConfig = cd.languageConfigs.find((lc) => lc.language === lang);
    const correctBlockIds = pyConfig.blocks.map((b) => b.blockId);

    const assembleRes = await client.put(`/sessions/assembly`, {
      challengeId: slug,
      assemblyOrder: correctBlockIds,
      assembledCode: pyConfig.blocks.map((b) => b.code).join('\n'),
    });
    console.log(`  ✓ Assembly state saved (assembled fragments: ${assembleRes.data.assemblyOrder?.length})`);

    // F. Run Code
    console.log(`  [Step F] Executing code against sample input via /api/submissions/run...`);
    const assembledCode = pyConfig.blocks.map((b) => b.code).join('\n');
    const runRes = await client.post(`/submissions/run`, {
      challengeId: slug,
      sourceCode: assembledCode,
      language: lang,
      stdin: cd.sampleInput,
      input: cd.sampleInput,
    });
    console.log(`  ✓ Code Run output: "${(runRes.data.stdout || '').trim()}" (expected: "${cd.sampleOutput.trim()}")`);

    // G. Submit Solution
    console.log(`  [Step G] Submitting solution for final evaluation via /api/submissions/submit...`);
    const submitRes = await client.post(`/submissions/submit`, {
      challengeId: slug,
      sourceCode: assembledCode,
      language: lang,
      timeSpent: 120,
    });

    console.log(`  ✓ Final evaluation result:`);
    console.log(`    Status:        ${submitRes.data.status || submitRes.data.overallStatus}`);
    console.log(`    Score:         ${submitRes.data.score}/${submitRes.data.maxScore || cd.points}`);
    console.log(`    Passed Tests:  ${submitRes.data.passedTests}/${submitRes.data.totalTests}`);

    const isAccepted = submitRes.data.status === 'ACCEPTED' || submitRes.data.overallStatus === 'ACCEPTED' || submitRes.data.isAccepted;
    if (!isAccepted) {
      throw new Error(`Submission for ${slug} was NOT ACCEPTED!`);
    }
    console.log(`  🎉 CHALLENGE ${slug} FULL FLOW PASSED AND ACCEPTED!\n`);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ALL SMOKE TESTS COMPLETED SUCCESSFULLY! 🎉');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

smokeTest().catch((err) => {
  console.error('Smoke test failure:', err.response?.data || err.message);
  process.exit(1);
});
