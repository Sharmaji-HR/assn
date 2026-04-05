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

describe('Dashboard Analytics Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('summary with multiple categories', async () => {
    const analystToken = tokenFor('ANALYST');

    prisma.transaction.groupBy
      .mockResolvedValueOnce([
        { type: 'INCOME', _sum: { amount: 5000 } },
        { type: 'EXPENSE', _sum: { amount: 2000 } }
      ])
      .mockResolvedValueOnce([
        { category: 'Salary', _sum: { amount: 5000 } },
        { category: 'Groceries', _sum: { amount: 800 } },
        { category: 'Utilities', _sum: { amount: 200 } },
        { category: 'Entertainment', _sum: { amount: 1000 } }
      ]);

    prisma.transaction.findMany.mockResolvedValue([
      { id: '1', amount: 5000, type: 'INCOME', category: 'Salary', date: new Date('2026-04-04') },
      { id: '2', amount: 800, type: 'EXPENSE', category: 'Groceries', date: new Date('2026-04-03') }
    ]);

    const response = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.totalIncome).toBe(5000);
    expect(response.body.data.totalExpenses).toBe(2000);
    expect(response.body.data.netBalance).toBe(3000);
    expect(response.body.data.categoryTotals).toHaveLength(4);
  });

  test('trends with multiple months', async () => {
    const analystToken = tokenFor('ANALYST');

    prisma.$queryRaw.mockResolvedValue([
      { month: '2026-01', income: 3000, expenses: 1000 },
      { month: '2026-02', income: 3500, expenses: 1200 },
      { month: '2026-03', income: 4000, expenses: 1500 },
      { month: '2026-04', income: 2000, expenses: 800 }
    ]);

    const response = await request(app)
      .get('/dashboard/trends')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.monthly).toHaveLength(4);
    expect(response.body.data.monthly[0].net).toBe(2000);
    expect(response.body.data.monthly[1].net).toBe(2300);
  });

  test('trends handles empty transaction list', async () => {
    const analystToken = tokenFor('ANALYST');

    prisma.$queryRaw.mockResolvedValue([]);

    const response = await request(app)
      .get('/dashboard/trends')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.monthly).toHaveLength(0);
  });

  test('viewer cannot access analytics endpoints', async () => {
    const viewerToken = tokenFor('VIEWER');

    const summaryResponse = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(summaryResponse.statusCode).toBe(403);

    const trendsResponse = await request(app)
      .get('/dashboard/trends')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(trendsResponse.statusCode).toBe(403);
  });

  test('only recent transactions included in summary', async () => {
    const analystToken = tokenFor('ANALYST');

    prisma.transaction.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const recent = [];
    for (let i = 0; i < 5; i++) {
      recent.push({
        id: `${i}`,
        amount: 100 * (i + 1),
        type: 'EXPENSE',
        category: 'Food',
        date: new Date('2026-04-04')
      });
    }

    prisma.transaction.findMany.mockResolvedValue(recent);

    const response = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.recentTransactions).toHaveLength(5);
  });
});
