const express = require('express');

const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  idParamSchema
} = require('../utils/validationSchemas');

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorize('VIEWER', 'ANALYST', 'ADMIN'), validate(transactionQuerySchema, 'query'), transactionController.getTransactions);
router.post('/', authorize('ADMIN'), validate(createTransactionSchema), transactionController.createTransaction);
router.put('/:id', authorize('ADMIN'), validate(idParamSchema, 'params'), validate(updateTransactionSchema), transactionController.updateTransaction);
router.delete('/:id', authorize('ADMIN'), validate(idParamSchema, 'params'), transactionController.deleteTransaction);

module.exports = router;
