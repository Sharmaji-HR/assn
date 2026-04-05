const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn()
  },
  $queryRaw: jest.fn()
}));

const prisma = require('../src/config/prisma');
const app = require('../src/app');

const tokenFor = (role, id = '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1') =>
  jwt.sign({ id, role, email: `${role.toLowerCase()}@example.com` }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

describe('RBAC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('unauthorized access is blocked without token', async () => {
    const response = await request(app).get('/users');

    expect(response.statusCode).toBe(401);
  });

  test('role-based permissions are enforced for /users', async () => {
    const viewerToken = tokenFor('VIEWER');

    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(response.statusCode).toBe(403);
  });

  test('admin can access /users', async () => {
    const adminToken = tokenFor('ADMIN');
    prisma.user.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('viewer is blocked from analytics while analyst is allowed', async () => {
    const viewerToken = tokenFor('VIEWER');
    const analystToken = tokenFor('ANALYST');

    const viewerResponse = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(viewerResponse.statusCode).toBe(403);

    prisma.transaction.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prisma.transaction.findMany.mockResolvedValue([]);

    const analystResponse = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(analystResponse.statusCode).toBe(200);
  });
});
