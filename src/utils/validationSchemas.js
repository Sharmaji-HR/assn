const { z } = require('zod');

const roles = ['VIEWER', 'ANALYST', 'ADMIN'];
const transactionTypes = ['income', 'expense'];

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72)
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72)
});

const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72),
  role: z.enum(roles).optional()
});

const updateUserSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    email: z.string().email().toLowerCase().optional(),
    password: z.string().min(8).max(72).optional(),
    role: z.enum(roles).optional(),
    isActive: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  });

const transactionBaseSchema = {
  amount: z.number().positive(),
  type: z.enum(transactionTypes),
  category: z.string().min(2).max(60),
  date: z.coerce.date(),
  notes: z.string().max(500).optional().nullable()
};

const createTransactionSchema = z.object(transactionBaseSchema);

const updateTransactionSchema = z
  .object({
    amount: z.number().positive().optional(),
    type: z.enum(transactionTypes).optional(),
    category: z.string().min(2).max(60).optional(),
    date: z.coerce.date().optional(),
    notes: z.string().max(500).optional().nullable()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  });

const transactionQuerySchema = z
  .object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    category: z.string().min(2).max(60).optional(),
    type: z.enum(transactionTypes).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0)
  })
  .refine((value) => !(value.dateFrom && value.dateTo) || value.dateFrom <= value.dateTo, {
    message: 'dateFrom must be earlier than or equal to dateTo',
    path: ['dateFrom']
  });

const idParamSchema = z.object({
  id: z.string().uuid('Invalid id format')
});

module.exports = {
  registerSchema,
  loginSchema,
  createUserSchema,
  updateUserSchema,
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  idParamSchema
};
