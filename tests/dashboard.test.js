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

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('summary calculations are correct', async () => {
    const analystToken = tokenFor('ANALYST');

    prisma.transaction.groupBy
      .mockResolvedValueOnce([
        { type: 'INCOME', _sum: { amount: 3000 } },
        { type: 'EXPENSE', _sum: { amount: 1200 } }
      ])
      .mockResolvedValueOnce([
        { category: 'Salary', _sum: { amount: 3000 } },
        { category: 'Food', _sum: { amount: 700 } }
      ]);

    prisma.transaction.findMany.mockResolvedValue([
      {
        id: '1',
        amount: 3000,
        type: 'INCOME',
        category: 'Salary',
        date: new Date('2026-04-01'),
        notes: null
      }
    ]);

    const response = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.totalIncome).toBe(3000);
    expect(response.body.data.totalExpenses).toBe(1200);
    expect(response.body.data.netBalance).toBe(1800);
    expect(response.body.data.categoryTotals).toHaveLength(2);
  });

  test('empty dataset handling returns zeroed summary', async () => {
    const analystToken = tokenFor('ANALYST');

    prisma.transaction.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prisma.transaction.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.totalIncome).toBe(0);
    expect(response.body.data.totalExpenses).toBe(0);
    expect(response.body.data.netBalance).toBe(0);
    expect(response.body.data.categoryTotals).toEqual([]);
    expect(response.body.data.recentTransactions).toEqual([]);
  });
});
