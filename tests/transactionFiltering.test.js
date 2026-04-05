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

describe('Transaction Validation and Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('create transaction with all fields', async () => {
    const adminToken = tokenFor('ADMIN');

    prisma.transaction.create.mockResolvedValue({
      id: '8f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      userId: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      amount: 500,
      type: 'EXPENSE',
      category: 'Groceries',
      date: new Date('2026-04-01'),
      notes: 'Weekly shopping',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 500,
        type: 'expense',
        category: 'Groceries',
        date: '2026-04-01',
        notes: 'Weekly shopping'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.notes).toBe('Weekly shopping');
  });

  test('update transaction', async () => {
    const adminToken = tokenFor('ADMIN');
    const txnId = '8f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1';

    prisma.transaction.findUnique.mockResolvedValue({
      id: txnId,
      userId: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      amount: 500,
      type: 'EXPENSE',
      category: 'Groceries',
      date: new Date('2026-04-01'),
      notes: null,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    prisma.transaction.update.mockResolvedValue({
      id: txnId,
      userId: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      amount: 550,
      type: 'EXPENSE',
      category: 'Groceries',
      date: new Date('2026-04-01'),
      notes: 'Updated notes',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .put(`/transactions/${txnId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 550,
        notes: 'Updated notes'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.amount).toBe(550);
  });

  test('delete transaction (soft delete)', async () => {
    const adminToken = tokenFor('ADMIN');
    const txnId = '8f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1';

    prisma.transaction.findUnique.mockResolvedValue({
      id: txnId,
      userId: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      amount: 500,
      type: 'EXPENSE',
      category: 'Groceries',
      date: new Date('2026-04-01'),
      notes: null,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .delete(`/transactions/${txnId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toContain('deleted');
  });

  test('cannot update already deleted transaction', async () => {
    const adminToken = tokenFor('ADMIN');
    const txnId = '8f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1';

    prisma.transaction.findUnique.mockResolvedValue({
      id: txnId,
      userId: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
      amount: 500,
      type: 'EXPENSE',
      category: 'Groceries',
      date: new Date('2026-04-01'),
      notes: null,
      isDeleted: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .put(`/transactions/${txnId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 600 });

    expect(response.statusCode).toBe(400);
  });

  test('filter by date range', async () => {
    const analystToken = tokenFor('ANALYST');

    prisma.transaction.findMany.mockResolvedValue([
      {
        id: '1',
        userId: '7f2e2e0d-cf0e-47f0-aefe-cf5f4c9658a1',
        amount: 1000,
        type: 'INCOME',
        category: 'Salary',
        date: new Date('2026-04-02'),
        notes: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    prisma.transaction.count.mockResolvedValue(1);

    const response = await request(app)
      .get('/transactions?dateFrom=2026-04-01&dateTo=2026-04-30&limit=20&offset=0')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date)
          })
        })
      })
    );
  });

  test('viewer cannot create or update transactions', async () => {
    const viewerToken = tokenFor('VIEWER');

    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        amount: 100,
        type: 'expense',
        category: 'Food',
        date: '2026-04-01'
      });

    expect(response.statusCode).toBe(403);
  });

  test('transactions inaccessible without authentication', async () => {
    const response = await request(app).get('/transactions');

    expect(response.statusCode).toBe(401);
  });

  test('invalid UUID for transaction ID rejected', async () => {
    const adminToken = tokenFor('ADMIN');

    const response = await request(app)
      .put('/transactions/invalid-uuid')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100 });

    expect(response.statusCode).toBe(400);
  });
});
