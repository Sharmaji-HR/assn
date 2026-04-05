const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const AppError = require('../utils/appError');
const { signToken } = require('../utils/jwt');

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const register = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new AppError('Email already registered', 409, 'DUPLICATE_EMAIL');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'VIEWER'
    }
  });

  const token = signToken({ id: user.id, role: user.role, email: user.email });

  return {
    user: sanitizeUser(user),
    token
  };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError('User account is deactivated', 403, 'USER_INACTIVE');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = signToken({ id: user.id, role: user.role, email: user.email });

  return {
    user: sanitizeUser(user),
    token
  };
};

module.exports = {
  register,
  login
};
