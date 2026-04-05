const asyncHandler = require('../utils/asyncHandler');
const transactionService = require('../services/transactionService');

const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createTransaction(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Transaction created',
    data: transaction
  });
});

const getTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.getTransactions(req.user.id, req.validatedQuery || req.query);

  res.status(200).json({
    success: true,
    data: result
  });
});

const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.updateTransaction(req.user.id, req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Transaction updated',
    data: transaction
  });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  await transactionService.softDeleteTransaction(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Transaction deleted'
  });
});

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
};
