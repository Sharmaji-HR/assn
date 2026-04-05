const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn()
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

describe('User Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('admin can create user with role assignment', async () => {
    const adminToken = tokenFor('ADMIN');

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: '8f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      name: 'Bob',
      email: 'bob@example.com',
      role: 'ANALYST',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'Password123!',
        role: 'ANALYST'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.role).toBe('ANALYST');
  });

  test('non-admin cannot create user', async () => {
    const viewerToken = tokenFor('VIEWER');

    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'Password123!'
      });

    expect(response.statusCode).toBe(403);
  });

  test('admin can list all users', async () => {
    const adminToken = tokenFor('ADMIN');

    prisma.user.findMany.mockResolvedValue([
      {
        id: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '8f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
        name: 'Bob',
        email: 'bob@example.com',
        role: 'VIEWER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  test('user cannot update other users', async () => {
    const viewerToken = tokenFor('VIEWER', '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1');
    const otherId = '8f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1';

    prisma.user.findUnique.mockResolvedValue({
      id: otherId,
      name: 'Bob',
      email: 'bob@example.com',
      role: 'VIEWER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .patch(`/users/${otherId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Hacked' });

    expect(response.statusCode).toBe(403);
  });

  test('user can self-update name', async () => {
    const userId = '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1';
    const viewerToken = tokenFor('VIEWER', userId);

    prisma.user.findUnique.mockResolvedValue({
      id: userId,
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    prisma.user.update.mockResolvedValue({
      id: userId,
      name: 'Alice Updated',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .patch(`/users/${userId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Alice Updated' });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe('Alice Updated');
  });

  test('user cannot escalate own role', async () => {
    const userId = '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1';
    const viewerToken = tokenFor('VIEWER', userId);

    prisma.user.findUnique.mockResolvedValue({
      id: userId,
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .patch(`/users/${userId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ role: 'ADMIN' });

    expect(response.statusCode).toBe(403);
  });

  test('admin cannot deactivate self', async () => {
    const adminId = '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1';
    const adminToken = tokenFor('ADMIN', adminId);

    prisma.user.findUnique.mockResolvedValue({
      id: adminId,
      name: 'Alice',
      email: 'alice@example.com',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .patch(`/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(response.statusCode).toBe(400);
  });

  test('admin can deactivate other users', async () => {
    const adminToken = tokenFor('ADMIN');
    const userId = '8f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1';

    prisma.user.findUnique.mockResolvedValue({
      id: userId,
      name: 'Bob',
      email: 'bob@example.com',
      role: 'VIEWER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    prisma.user.update.mockResolvedValue({
      id: userId,
      name: 'Bob',
      email: 'bob@example.com',
      role: 'VIEWER',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .patch(`/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.isActive).toBe(false);
  });

  test('duplicate email is rejected', async () => {
    const adminToken = tokenFor('ADMIN');

    prisma.user.findUnique.mockResolvedValue({
      id: 'existing-id',
      name: 'Existing',
      email: 'existing@example.com',
      role: 'VIEWER'
    });

    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'NewUser',
        email: 'existing@example.com',
        password: 'Password123!'
      });

    expect(response.statusCode).toBe(409);
  });
});
