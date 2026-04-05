const request = require('supertest');
const bcrypt = require('bcrypt');

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

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('register success', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123!'
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe('alice@example.com');
  });

  test('register failure on duplicate email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

    const response = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123!'
    });

    expect(response.statusCode).toBe(409);
    expect(response.body.message).toContain('Email already registered');
  });

  test('login success', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 12);

    prisma.user.findUnique.mockResolvedValue({
      id: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: true,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app).post('/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123!'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  test('login failure with invalid credentials', async () => {
    const passwordHash = await bcrypt.hash('AnotherPassword!', 12);

    prisma.user.findUnique.mockResolvedValue({
      id: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: true,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app).post('/auth/login').send({
      email: 'alice@example.com',
      password: 'WrongPassword123!'
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Invalid email or password');
  });

  test('login failure with non-existent user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const response = await request(app).post('/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'Password123!'
    });

    expect(response.statusCode).toBe(401);
  });

  test('login failure with inactive user', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 12);

    prisma.user.findUnique.mockResolvedValue({
      id: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: false,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app).post('/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123!'
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toContain('deactivated');
  });

  test('register validation fails with short password', async () => {
    const response = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'short'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});
