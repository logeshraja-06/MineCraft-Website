require('./testSafetyGuard');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const User = require('../src/models/User');
const Challenge = require('../src/models/Challenge');
const TestCase = require('../src/models/TestCase');
const QRBlock = require('../src/models/QRBlock');
const ParticipantSession = require('../src/models/ParticipantSession');
const Submission = require('../src/models/Submission');
const env = require('../src/config/env');

let mongoServer;
let adminToken = '';
let testChallenge = null;

jest.setTimeout(60000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(uri);

  // 1. Create admin user
  const admin = await User.create({
    name: 'Master Admin',
    email: 'admin@mindcraft.local',
    password: 'AdminSecret123!',
    role: 'admin',
  });

  const adminLogin = await request(app).post('/api/auth/admin/login').send({
    email: 'admin@mindcraft.local',
    password: 'AdminSecret123!',
  });
  adminToken = adminLogin.body.token;

  // 2. Create test challenge with test case and blocks
  testChallenge = await Challenge.create({
    slug: 'ch-test-sum',
    title: 'Test Find Sum',
    description: 'Add two numbers',
    points: 100,
    difficulty: 'Easy',
    category: 'Math',
    timeLimitSeconds: 1200,
    supportedLanguages: ['python'],
    isActive: true,
  });

  await TestCase.create({
    challengeId: testChallenge._id,
    input: '5',
    expectedOutput: '15',
    isEnabled: true,
    isHidden: false,
  });

  await QRBlock.create({
    challengeId: testChallenge._id,
    blockId: 'B-TEST-1',
    title: 'Block 1',
    language: 'python',
    code: 'n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)',
    codeSnippet: 'n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)',
    type: 'LOGIC',
    correctOrder: 1,
    isDecoy: false,
    qrToken: 'MCQR-TEST-TOKEN-12345',
  });
}, 60000);


afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}, 60000);


describe('MindCraft Backend Core Verification Suite', () => {
  let participantToken1 = '';
  let participantUser1 = null;

  test('1. Participant registration: stores name, participantId, email, college, department and returns JWT (no password hash)', async () => {
    const res = await request(app).post('/api/participants/register').send({
      name: 'Alice Contestant',
      participantId: 'MC-ALICE01',
      email: 'alice@mit.edu',
      college: 'MIT',
      department: 'EECS',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Alice Contestant');
    expect(res.body.user.participantId).toBe('MC-ALICE01');
    expect(res.body.user.college).toBe('MIT');
    expect(res.body.user.department).toBe('EECS');
    expect(res.body.user.password).toBeUndefined(); // Never expose password

    participantToken1 = res.body.token;
    participantUser1 = res.body.user;
  });

  test('2. Duplicate registration rejection: returns 409 Conflict with clear message', async () => {
    // Duplicate participantId
    const resDupId = await request(app).post('/api/participants/register').send({
      name: 'Bob Duplicate',
      participantId: 'MC-ALICE01',
      email: 'bob@harvard.edu',
      college: 'Harvard',
      department: 'CS',
    });
    expect(resDupId.status).toBe(409);
    expect(resDupId.body.success).toBe(false);
    expect(resDupId.body.message).toMatch(/participant id.*already registered/i);

    // Duplicate email
    const resDupEmail = await request(app).post('/api/participants/register').send({
      name: 'Bob Duplicate Email',
      participantId: 'MC-BOB99',
      email: 'alice@mit.edu',
      college: 'Harvard',
      department: 'CS',
    });
    expect(resDupEmail.status).toBe(409);
    expect(resDupEmail.body.success).toBe(false);
    expect(resDupEmail.body.message).toMatch(/email.*already registered/i);
  });

  test('3. Auth Guards: unauthenticated calls return 401, participant token on admin routes returns 403', async () => {
    // Unauthenticated calls
    const noAuthAdmin = await request(app).get('/api/admin/overview');
    expect(noAuthAdmin.status).toBe(401);

    const noAuthSubmit = await request(app).post('/api/submissions/submit').send({
      language: 'python',
      sourceCode: 'print(1)',
      challengeId: testChallenge._id,
    });
    expect(noAuthSubmit.status).toBe(401);

    const noAuthRank = await request(app).get('/api/leaderboard/my-rank');
    expect(noAuthRank.status).toBe(401);

    // Participant token on admin route -> 403 Forbidden
    const partOnAdmin = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${participantToken1}`);
    expect(partOnAdmin.status).toBe(403);
  });

  test('4. Server-authoritative session, assembly sync, and submit flow', async () => {
    // 4a. Start session
    const startRes = await request(app)
      .post('/api/sessions/start')
      .set('Authorization', `Bearer ${participantToken1}`)
      .send({
        challengeId: testChallenge._id,
        language: 'python',
      });

    expect(startRes.status).toBe(200);
    expect(startRes.body.session).toBeDefined();
    expect(startRes.body.session.status).toBe('ACTIVE');

    // 4b. Sync assembly order to server
    const validCode = 'n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)';
    const assemblyRes = await request(app)
      .put('/api/sessions/assembly')
      .set('Authorization', `Bearer ${participantToken1}`)
      .send({
        challengeId: testChallenge._id,
        assemblyOrder: ['B-TEST-1'],
        assembledCode: validCode,
      });

    expect(assemblyRes.status).toBe(200);
    expect(assemblyRes.body.assemblyOrder).toEqual(['B-TEST-1']);

    // 4c. Submit solution matching assembled session
    const subRes = await request(app)
      .post('/api/submissions/submit')
      .set('Authorization', `Bearer ${participantToken1}`)
      .send({
        challengeId: testChallenge._id,
        language: 'python',
        sourceCode: validCode,
      });

    expect(subRes.status).toBe(200);
    expect(subRes.body.success).toBe(true);

    // Check DB persistence
    const savedSub = await Submission.findOne({ userId: participantUser1._id });
    expect(savedSub).toBeDefined();
    expect(savedSub.status).toBe('ACCEPTED');
    expect(savedSub.attemptNumber).toBe(1);
    expect(savedSub.timeTakenSeconds).toBeGreaterThanOrEqual(0);
  });

  test('5. Leaderboard scoring, 5-minute penalty per failed attempt, and tiebreaker sorting', async () => {
    // Register participant 2 (Bob)
    const bobReg = await request(app).post('/api/participants/register').send({
      name: 'Bob RunnerUp',
      participantId: 'MC-BOB02',
      email: 'bob@stanford.edu',
      college: 'Stanford',
      department: 'CS',
    });
    const bobToken = bobReg.body.token;
    const bobUser = bobReg.body.user;

    // Bob starts session
    await request(app)
      .post('/api/sessions/start')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ challengeId: testChallenge._id, language: 'python' });

    // Bob fails once (WRONG_ANSWER)
    const wrongCode = 'n = int(input())\nprint(999999)';
    await request(app)
      .put('/api/sessions/assembly')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        challengeId: testChallenge._id,
        assemblyOrder: ['B-TEST-WRONG'],
        assembledCode: wrongCode,
      });

    await request(app)
      .post('/api/submissions/submit')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        challengeId: testChallenge._id,
        language: 'python',
        sourceCode: wrongCode,
      });

    // Bob then submits correct code
    const validCode = 'n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)';
    await request(app)
      .put('/api/sessions/assembly')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        challengeId: testChallenge._id,
        assemblyOrder: ['B-TEST-1'],
        assembledCode: validCode,
      });

    await request(app)
      .post('/api/submissions/submit')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        challengeId: testChallenge._id,
        language: 'python',
        sourceCode: validCode,
      });

    // Fetch leaderboard
    const lbRes = await request(app).get('/api/leaderboard');
    expect(lbRes.status).toBe(200);
    const rankings = lbRes.body.rankings;

    // Both have solved 1 challenge (100 points)
    // Alice had 0 failed attempts -> totalTime = timeTaken
    // Bob had 1 failed attempt -> totalTime = timeTaken + 300s (penalty)
    // Therefore Alice must be ranked #1, Bob #2!
    expect(rankings.length).toBeGreaterThanOrEqual(2);
    expect(rankings[0].name).toBe('Alice Contestant');
    expect(rankings[0].rank).toBe(1);
    expect(rankings[1].name).toBe('Bob RunnerUp');
    expect(rankings[1].rank).toBe(2);
    expect(rankings[1].totalTimeSeconds).toBeGreaterThanOrEqual(300);
  });

  test('6. CSV Export formula injection protection (=, +, -, @)', async () => {
    // Register participant with malicious CSV formula in name
    await request(app).post('/api/participants/register').send({
      name: '=cmd|\' /C calc\'!A0',
      participantId: '+MC-HACK',
      email: 'hacker@college.edu',
      college: '@MaliciousCollege',
      department: '-InjectedDept',
    });

    const exportRes = await request(app)
      .get('/api/admin/leaderboard/export?format=csv')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(exportRes.status).toBe(200);
    const csvText = exportRes.text;

    // Verify cell sanitization: cells starting with = + - @ MUST be prefixed with single quote '
    expect(csvText).toContain("'=cmd");
    expect(csvText).toContain("'+MC-HACK");
    expect(csvText).toContain("'@MaliciousCollege");
    expect(csvText).toContain("'-InjectedDept");
  });
});
