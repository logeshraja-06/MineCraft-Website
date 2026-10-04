require('./testSafetyGuard');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Challenge = require('../src/models/Challenge');
const QRBlock = require('../src/models/QRBlock');
const TestCase = require('../src/models/TestCase');
const { generateCodeBlocks } = require('../src/services/challenge/codeBlockSplitter');

let mongoServer;

describe('Blind Coding Platform - Admin & Challenge Workflow Suite', () => {
  let adminToken = '';
  let participantToken = '';
  let challengeId = '';

  beforeAll(async () => {
    // 1. Initialize strictly in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);

    // 2. Create isolated Admin user in memory
    await User.create({
      name: 'Test Admin',
      email: 'admin_test@mindcraft.local',
      password: 'AdminPassword123!',
      role: 'admin',
    });

    const adminRes = await request(app).post('/api/auth/admin/login').send({
      email: 'admin_test@mindcraft.local',
      password: 'AdminPassword123!',
    });
    adminToken = adminRes.body.token;

    // 3. Create isolated Participant user in memory
    const partEmail = `test_part_${Date.now()}@college.edu`;
    const regRes = await request(app).post('/api/participants/register').send({
      name: 'Jest Participant',
      participantId: `P-${Date.now()}`,
      email: partEmail,
      teamName: 'JestSquad',
      college: 'Tech University',
      department: 'Computer Science',
    });
    participantToken = regRes.body.token;
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 60000);

  test('1. Syntax-Aware Code Block Splitter creates ordered fragments', () => {
    const javaCode = `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`;
    const blocks = generateCodeBlocks({
      sourceCode: javaCode,
      language: 'java',
      strategy: 'statement',
      initialVisibleCount: 3,
      randomize: false,
      slug: 'test-adder',
    });

    expect(blocks.length).toBeGreaterThanOrEqual(7);
    expect(blocks[0].originalOrder).toBe(1);
    expect(blocks[0].codeSnippet).toContain('import java.util.*;');
    expect(blocks[1].originalOrder).toBe(2);
    expect(blocks[1].codeSnippet).toContain('public class Main');
  });

  test('2. Admin Overview API returns real telemetry data', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toBeDefined();
    expect(typeof res.body.stats.totalParticipants).toBe('number');
    expect(typeof res.body.stats.totalChallenges).toBe('number');
  });

  test('3. Challenge Creation with automated code block splitting & test cases', async () => {
    const javaSource = `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`;
    const res = await request(app)
      .post('/api/admin/challenges')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Jest Adder Challenge',
        slug: `jest-adder-${Date.now()}`,
        difficulty: 'Easy',
        points: 100,
        description: 'Read two numbers and print their sum.',
        sourceLanguage: 'java',
        sourceCode: javaSource,
        splitStrategy: 'statement',
        status: 'Published',
        testCases: [
          { input: '10 20', expectedOutput: '30', isHidden: false, weight: 50 },
          { input: '100 200', expectedOutput: '300', isHidden: true, weight: 50 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    challengeId = res.body.challenge._id;
    expect(challengeId).toBeDefined();
  });

  test('4. Participant Challenge endpoint NEVER exposes complete sourceCode or originalOrder', async () => {
    const chalRes = await request(app).get(`/api/challenges/${challengeId}`);
    expect(chalRes.status).toBe(200);
    expect(chalRes.body.challenge.sourceCode).toBeUndefined();

    const blocksRes = await request(app).get(`/api/challenges/${challengeId}/blocks`);
    expect(blocksRes.status).toBe(200);
    expect(Array.isArray(blocksRes.body.blocks)).toBe(true);
    blocksRes.body.blocks.forEach((b) => {
      expect(b.originalOrder).toBeUndefined();
    });
  });

  test('5. Excel (.xlsx) export streams actual binary spreadsheet', async () => {
    const res = await request(app)
      .get('/api/admin/reports/export/excel')
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(data)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(res.body.length).toBeGreaterThan(500);
  });

  test('6. PDF (.pdf) export streams actual binary PDF document', async () => {
    const res = await request(app)
      .get('/api/admin/reports/export/pdf')
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(data)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.slice(0, 4).toString()).toBe('%PDF');
  });

  test('7. Security Access Control: Unauthenticated and non-admin requests are rejected', async () => {
    const unauthRes = await request(app).get('/api/admin/overview');
    expect(unauthRes.status).toBe(401);

    const partRes = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${participantToken}`);
    expect(partRes.status).toBe(403);
  });
});
