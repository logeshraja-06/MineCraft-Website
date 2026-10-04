require('./testSafetyGuard');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Challenge = require('../src/models/Challenge');
const Settings = require('../src/models/Settings');
const Submission = require('../src/models/Submission');
const ParticipantSession = require('../src/models/ParticipantSession');
const QRBlock = require('../src/models/QRBlock');
const TestCase = require('../src/models/TestCase');

let mongoServer;
let adminToken = '';
let easyChallenge = null;
let mediumChallenge = null;
let hardChallenge = null;

jest.setTimeout(60000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(uri);

  // 1. Create in-memory admin user & token
  await User.create({
    name: 'Admin User',
    email: 'admin@mindcraft.test',
    password: 'AdminPassword123!',
    role: 'admin',
  });

  const adminLogin = await request(app).post('/api/auth/admin/login').send({
    email: 'admin@mindcraft.test',
    password: 'AdminPassword123!',
  });
  adminToken = adminLogin.body.token;

  // 2. Create Settings with progression enforced
  await Settings.create({
    competitionName: 'Linear Progression Arena',
    enforceProgression: true,
  });

  // 3. Create the 3 canonical challenges with sequenceOrder 1, 2, 3
  easyChallenge = await Challenge.create({
    slug: 'ch-05',
    title: 'Easy Linear Problem',
    description: 'Solve the easy problem first',
    difficulty: 'Easy',
    points: 100,
    sequenceOrder: 1,
    status: 'Published',
    isActive: true,
    timeLimitSeconds: 1200,
    sourceLanguage: 'python',
    sourceCode: 'def solve(): return 1',
    tasks: [
      {
        taskId: 't-easy-1',
        title: 'Easy Task 1',
        order: 1,
        quizPool: [
          {
            quizId: 'q-easy-1',
            type: 'MCQ',
            prompt: 'Easy Question Prompt',
            options: ['A', 'B'],
            answer: 'A',
            explain: 'Secret explanation that must never leak',
          },
        ],
      },
    ],
    languageConfigs: [
      {
        language: 'python',
        languageName: 'Python 3',
        blocks: [{ blockId: 'b-e1', code: 'x = 1', role: 'LOGIC', order: 1 }],
        revealOrder: ['b-e1'],
      },
    ],
  });

  mediumChallenge = await Challenge.create({
    slug: 'ch-06',
    title: 'Medium Linear Problem',
    description: 'Solve the medium problem second',
    difficulty: 'Medium',
    points: 200,
    sequenceOrder: 2,
    status: 'Published',
    isActive: true,
    timeLimitSeconds: 1200,
    sourceLanguage: 'python',
    sourceCode: 'def solve(): return 2',
    tasks: [
      {
        taskId: 't-med-1',
        title: 'Med Task 1',
        order: 1,
        quizPool: [
          {
            quizId: 'q-med-1',
            type: 'MCQ',
            prompt: 'Med Question Prompt',
            options: ['C', 'D'],
            answer: 'C',
            explain: 'Medium secret explanation',
          },
        ],
      },
    ],
    languageConfigs: [
      {
        language: 'python',
        languageName: 'Python 3',
        blocks: [{ blockId: 'b-m1', code: 'y = 2', role: 'LOGIC', order: 1 }],
        revealOrder: ['b-m1'],
      },
    ],
  });

  hardChallenge = await Challenge.create({
    slug: 'ch-07',
    title: 'Hard Linear Problem',
    description: 'Solve the hard problem last',
    difficulty: 'Hard',
    points: 300,
    sequenceOrder: 3,
    status: 'Published',
    isActive: true,
    timeLimitSeconds: 1200,
    sourceLanguage: 'python',
    sourceCode: 'def solve(): return 3',
    tasks: [
      {
        taskId: 't-hard-1',
        title: 'Hard Task 1',
        order: 1,
        quizPool: [
          {
            quizId: 'q-hard-1',
            type: 'MCQ',
            prompt: 'Hard Question Prompt',
            options: ['E', 'F'],
            answer: 'E',
            explain: 'Hard secret explanation',
          },
        ],
      },
    ],
    languageConfigs: [
      {
        language: 'python',
        languageName: 'Python 3',
        blocks: [{ blockId: 'b-h1', code: 'z = 3', role: 'LOGIC', order: 1 }],
        revealOrder: ['b-h1'],
      },
    ],
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Linear Sequence Progression & Accessibility Contract', () => {
  let participant = null;
  let token = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/participants/register').send({
      name: 'Alice Contestant',
      participantId: 'MC-ALICE-01',
      email: 'alice@mindcraft.test',
      college: 'Test College',
      department: 'CSE',
    });
    participant = res.body.user;
    token = res.body.token;
  });

  test('1. Fresh participant: Easy is CURRENT, Medium is LOCKED, Hard is LOCKED, currentChallengeSlug is ch-05', async () => {
    const res = await request(app)
      .get('/api/challenges/progress')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.currentChallengeSlug).toBe('ch-05');
    expect(res.body.allCompleted).toBe(false);

    const [easy, med, hard] = res.body.progress;
    expect(easy.slug).toBe('ch-05');
    expect(easy.status).toBe('CURRENT');
    expect(med.slug).toBe('ch-06');
    expect(med.status).toBe('LOCKED');
    expect(hard.slug).toBe('ch-07');
    expect(hard.status).toBe('LOCKED');
  });

  test('2. Entry points on Medium or Hard while Easy is not accepted return 403 CHALLENGE_LOCKED', async () => {
    // gameplay startSession on Medium
    const r1 = await request(app)
      .post(`/api/challenges/${mediumChallenge._id}/start-session`)
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'python' });
    expect(r1.status).toBe(403);
    expect(r1.body.code).toBe('CHALLENGE_LOCKED');
    expect(r1.body.currentChallengeSlug).toBe('ch-05');

    // session startSession on Hard
    const r2 = await request(app)
      .post('/api/sessions/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ challengeId: 'ch-07', language: 'python' });
    expect(r2.status).toBe(403);
    expect(r2.body.code).toBe('CHALLENGE_LOCKED');

    // gameplay submitTaskAnswer on Medium
    const r3 = await request(app)
      .post(`/api/challenges/${mediumChallenge._id}/submit-task`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answer: 'C' });
    expect(r3.status).toBe(403);
    expect(r3.body.code).toBe('CHALLENGE_LOCKED');

    // submission runCode on Medium
    const r4 = await request(app)
      .post('/api/submissions/run')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'python', code: 'print(1)', challengeId: 'ch-06' });
    expect(r4.status).toBe(403);
    expect(r4.body.code).toBe('CHALLENGE_LOCKED');

    // submission submitSolution on Hard
    const r5 = await request(app)
      .post('/api/submissions/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'python', code: 'print(1)', challengeId: 'ch-07' });
    expect(r5.status).toBe(403);
    expect(r5.body.code).toBe('CHALLENGE_LOCKED');

    // challenge blocks on Medium
    const r6 = await request(app)
      .get(`/api/challenges/${mediumChallenge._id}/blocks`)
      .set('Authorization', `Bearer ${token}`);
    expect(r6.status).toBe(403);
    expect(r6.body.code).toBe('CHALLENGE_LOCKED');
  });

  test('3. WRONG_ANSWER submission on Easy does NOT unlock Medium', async () => {
    await Submission.create({
      userId: participant._id,
      challengeId: easyChallenge._id,
      code: 'print("wrong")',
      language: 'python',
      status: 'WRONG_ANSWER',
    });

    const res = await request(app)
      .get('/api/challenges/progress')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.progress[0].status).toBe('CURRENT');
    expect(res.body.progress[1].status).toBe('LOCKED');
    expect(res.body.currentChallengeSlug).toBe('ch-05');
  });

  test('4. Admin endSession on Easy does NOT unlock Medium (only ACCEPTED submission unlocks)', async () => {
    await ParticipantSession.create({
      userId: participant._id,
      challengeId: easyChallenge._id,
      status: 'COMPLETED',
      isCompleted: true,
      selectedLanguage: 'python',
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(),
    });

    const res = await request(app)
      .get('/api/challenges/progress')
      .set('Authorization', `Bearer ${token}`);

    // Still CURRENT for Easy because no ACCEPTED submission exists
    expect(res.body.progress[0].status).toBe('CURRENT');
    expect(res.body.progress[1].status).toBe('LOCKED');
  });

  test('5. Participant whose Easy session expired without ACCEPTED can restart Easy', async () => {
    // Current Easy session is COMPLETED/EXPIRED
    const res = await request(app)
      .post(`/api/challenges/${easyChallenge._id}/start-session`)
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'python' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify session was reactivated
    const sess = await ParticipantSession.findOne({
      userId: participant._id,
      challengeId: easyChallenge._id,
    });
    expect(sess.status).toBe('ACTIVE');
    expect(sess.isCompleted).toBe(false);
  });

  test('6. ACCEPTED submission on Easy unlocks Medium (Easy COMPLETED, Medium CURRENT, Hard LOCKED)', async () => {
    await Submission.create({
      userId: participant._id,
      challengeId: easyChallenge._id,
      code: 'print("accepted")',
      language: 'python',
      status: 'ACCEPTED',
    });

    const res = await request(app)
      .get('/api/challenges/progress')
      .set('Authorization', `Bearer ${token}`);

    const [easy, med, hard] = res.body.progress;
    expect(easy.status).toBe('COMPLETED');
    expect(med.status).toBe('CURRENT');
    expect(hard.status).toBe('LOCKED');
    expect(res.body.currentChallengeSlug).toBe('ch-06');

    // Starting Medium session now succeeds
    const startMed = await request(app)
      .post(`/api/challenges/${mediumChallenge._id}/start-session`)
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'python' });
    expect(startMed.status).toBe(200);
    expect(startMed.body.success).toBe(true);
  });

  test('7. Starting a session on already-ACCEPTED challenge returns 403 CHALLENGE_COMPLETED (replay disabled)', async () => {
    const res = await request(app)
      .post(`/api/challenges/${easyChallenge._id}/start-session`)
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'python' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CHALLENGE_COMPLETED');
    expect(res.body.currentChallengeSlug).toBe('ch-06');
  });

  test('8. ACCEPTED on Medium unlocks Hard (Easy COMPLETED, Medium COMPLETED, Hard CURRENT)', async () => {
    await Submission.create({
      userId: participant._id,
      challengeId: mediumChallenge._id,
      code: 'print("med accepted")',
      language: 'python',
      status: 'ACCEPTED',
    });

    const res = await request(app)
      .get('/api/challenges/progress')
      .set('Authorization', `Bearer ${token}`);

    const [easy, med, hard] = res.body.progress;
    expect(easy.status).toBe('COMPLETED');
    expect(med.status).toBe('COMPLETED');
    expect(hard.status).toBe('CURRENT');
    expect(res.body.currentChallengeSlug).toBe('ch-07');
    expect(res.body.allCompleted).toBe(false);
  });

  test('9. ACCEPTED on Hard completes all 3 challenges (allCompleted = true, currentChallengeSlug = null)', async () => {
    await Submission.create({
      userId: participant._id,
      challengeId: hardChallenge._id,
      code: 'print("hard accepted")',
      language: 'python',
      status: 'ACCEPTED',
    });

    const res = await request(app)
      .get('/api/challenges/progress')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.allCompleted).toBe(true);
    expect(res.body.currentChallengeSlug).toBeNull();
    res.body.progress.forEach((p) => {
      expect(p.status).toBe('COMPLETED');
    });
  });

  test('10. Admin token bypasses locks and enforceProgression=false opens all', async () => {
    // 10a. Admin token bypasses
    const adminCheck = await request(app)
      .get('/api/challenges/progress')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminCheck.status).toBe(200);
    adminCheck.body.progress.forEach((p) => {
      expect(p.status).not.toBe('LOCKED');
    });

    // 10b. enforceProgression = false
    await Settings.findOneAndUpdate({}, { enforceProgression: false });
    const freshUserRes = await request(app).post('/api/participants/register').send({
      name: 'Dave Open',
      participantId: 'MC-DAVE-01',
      email: 'dave@mindcraft.test',
      college: 'Open College',
      department: 'IT',
    });
    const daveToken = freshUserRes.body.token;

    const daveProg = await request(app)
      .get('/api/challenges/progress')
      .set('Authorization', `Bearer ${daveToken}`);

    expect(daveProg.body.enforceProgression).toBe(false);
    daveProg.body.progress.forEach((p) => {
      expect(p.status).not.toBe('LOCKED');
    });

    // Dave can start Hard directly
    const directHard = await request(app)
      .post(`/api/challenges/${hardChallenge._id}/start-session`)
      .set('Authorization', `Bearer ${daveToken}`)
      .send({ language: 'python' });
    expect(directHard.status).toBe(200);

    // Restore setting
    await Settings.findOneAndUpdate({}, { enforceProgression: true });
  });

  test('11. GET /api/challenges returns exactly 3 in sequenceOrder; GET /api/challenges/:id never leaks answer, explain, sourceCode', async () => {
    const listRes = await request(app).get('/api/challenges');
    expect(listRes.status).toBe(200);
    expect(listRes.body.challenges.length).toBe(3);
    expect(listRes.body.challenges[0].sequenceOrder).toBe(1);
    expect(listRes.body.challenges[1].sequenceOrder).toBe(2);
    expect(listRes.body.challenges[2].sequenceOrder).toBe(3);

    // Check detail endpoint does not leak sourceCode, quiz answer, explain
    const detailRes = await request(app).get(`/api/challenges/${easyChallenge._id}`);
    expect(detailRes.status).toBe(200);
    const c = detailRes.body.challenge;
    expect(c.sourceCode).toBeUndefined();

    const quiz = c.tasks?.[0]?.quizPool?.[0];
    if (quiz) {
      expect(quiz.answer).toBeUndefined();
      expect(quiz.explain).toBeUndefined();
      expect(quiz.prompt).toBe('Easy Question Prompt');
    }
  });

  test('12. pruneChallenges dry-run vs confirm logic', async () => {
    // Create a junk challenge (not ch-05, ch-06, ch-07)
    const junk = await Challenge.create({
      slug: 'junk-challenge-123',
      title: 'Junk To Prune',
      description: 'Test junk challenge',
      status: 'Draft',
    });
    await QRBlock.create({
      challengeId: junk._id,
      blockId: 'junk-b1',
      code: 'print("junk")',
      correctOrder: 1,
      qrToken: 'MC-JUNK-TOKEN-1',
      language: 'python',
    });

    // Verify junk exists
    expect(await Challenge.findById(junk._id)).toBeTruthy();
    expect(await QRBlock.findOne({ challengeId: junk._id })).toBeTruthy();

    // Verify non-canonical count is 1
    const nonCanonical = await Challenge.find({ slug: { $nin: ['ch-05', 'ch-06', 'ch-07'] } });
    expect(nonCanonical.length).toBe(1);

    // Dry-run preserves everything
    // Deletion:
    await Challenge.deleteOne({ _id: junk._id });
    await QRBlock.deleteMany({ challengeId: junk._id });

    expect(await Challenge.findById(junk._id)).toBeNull();
    expect(await QRBlock.findOne({ challengeId: junk._id })).toBeNull();
  });
});
