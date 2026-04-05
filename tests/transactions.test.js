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

describe('Transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('create transaction success', async () => {
    const adminToken = tokenFor('ADMIN');

    prisma.transaction.create.mockResolvedValue({
      id: '8f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      userId: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      amount: 1500,
      type: 'INCOME',
      category: 'Salary',
      date: new Date('2026-04-01'),
      notes: null,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 1500,
        type: 'income',
        category: 'Salary',
        date: '2026-04-01'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.amount).toBe(1500);
    expect(response.body.data.type).toBe('income');
  });

  test('validation error for negative amount', async () => {
    const adminToken = tokenFor('ADMIN');

    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: -1,
        type: 'expense',
        category: 'Food',
        date: '2026-04-01'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('Validation failed');
  });

  test('filtering works with category, type, and pagination', async () => {
    const analystToken = tokenFor('ANALYST');

    prisma.transaction.findMany.mockResolvedValue([
      {
        id: '8f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
        userId: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
        amount: 100,
        type: 'EXPENSE',
        category: 'Food',
        date: new Date('2026-04-01'),
        notes: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    prisma.transaction.count.mockResolvedValue(1);

    const response = await request(app)
      .get('/transactions?category=Food&type=expense&limit=10&offset=0')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'Food',
          type: 'EXPENSE'
        }),
        take: 10,
        skip: 0
      })
    );
  });
});
