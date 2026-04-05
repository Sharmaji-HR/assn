const prisma = require('../config/prisma');
const AppError = require('../utils/appError');

const mapTypeToEnum = (type) => (type ? type.toUpperCase() : type);
const mapTypeToResponse = (type) => type.toLowerCase();

const sanitizeTransaction = (transaction) => ({
  ...transaction,
  amount: Number(transaction.amount),
  type: mapTypeToResponse(transaction.type)
});

const createTransaction = async (userId, payload) => {
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      amount: payload.amount,
      type: mapTypeToEnum(payload.type),
      category: payload.category,
      date: payload.date,
      notes: payload.notes || null
    }
  });

  return sanitizeTransaction(transaction);
};

const getTransactions = async (userId, filters) => {
  const where = {
    userId,
    isDeleted: false
  };

  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = filters.dateFrom;
    if (filters.dateTo) where.date.lte = filters.dateTo;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.type) {
    where.type = mapTypeToEnum(filters.type);
  }

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: filters.limit,
      skip: filters.offset
    }),
    prisma.transaction.count({ where })
  ]);

  return {
    items: items.map(sanitizeTransaction),
    pagination: {
      total,
      limit: filters.limit,
      offset: filters.offset
    }
  };
};

const updateTransaction = async (userId, id, payload) => {
  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing || existing.userId !== userId) {
    throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
  }

  if (existing.isDeleted) {
    throw new AppError('Deleted transactions cannot be updated', 400, 'TRANSACTION_DELETED');
  }

  const data = {};
  if (typeof payload.amount !== 'undefined') data.amount = payload.amount;
  if (typeof payload.type !== 'undefined') data.type = mapTypeToEnum(payload.type);
  if (typeof payload.category !== 'undefined') data.category = payload.category;
  if (typeof payload.date !== 'undefined') data.date = payload.date;
  if (typeof payload.notes !== 'undefined') data.notes = payload.notes;

  const updated = await prisma.transaction.update({
    where: { id },
    data
  });

  return sanitizeTransaction(updated);
};

const softDeleteTransaction = async (userId, id) => {
  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing || existing.userId !== userId) {
    throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
  }

  if (existing.isDeleted) {
    throw new AppError('Transaction already deleted', 400, 'TRANSACTION_DELETED');
  }

  await prisma.transaction.update({
    where: { id },
    data: { isDeleted: true }
  });
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  softDeleteTransaction
};
