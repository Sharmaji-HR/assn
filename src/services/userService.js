const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const AppError = require('../utils/appError');

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const createUser = async (payload, currentUser) => {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });

  if (existing) {
    throw new AppError('Email already registered', 409, 'DUPLICATE_EMAIL');
  }

  if (payload.role && currentUser.role !== 'ADMIN') {
    throw new AppError('Only admins can assign roles', 403, 'ROLE_ESCALATION_BLOCKED');
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: payload.role || 'VIEWER'
    }
  });

  return sanitizeUser(user);
};

const getUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return users.map(sanitizeUser);
};

const updateUser = async (id, payload, currentUser) => {
  const targetUser = await prisma.user.findUnique({ where: { id } });

  if (!targetUser) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const isAdmin = currentUser.role === 'ADMIN';

  if (!isAdmin && currentUser.id !== id) {
    throw new AppError('Cannot update other users', 403, 'FORBIDDEN');
  }

  if ((payload.role || typeof payload.isActive === 'boolean') && !isAdmin) {
    throw new AppError('Only admins can change role or active status', 403, 'ROLE_ESCALATION_BLOCKED');
  }

  if (isAdmin && currentUser.id === id && payload.isActive === false) {
    throw new AppError('Admin cannot deactivate themselves', 400, 'SELF_DEACTIVATION_BLOCKED');
  }

  if (payload.email && payload.email !== targetUser.email) {
    const emailOwner = await prisma.user.findUnique({ where: { email: payload.email } });
    if (emailOwner && emailOwner.id !== id) {
      throw new AppError('Email already registered', 409, 'DUPLICATE_EMAIL');
    }
  }

  const updateData = {};

  if (typeof payload.name !== 'undefined') updateData.name = payload.name;
  if (typeof payload.email !== 'undefined') updateData.email = payload.email;
  if (typeof payload.role !== 'undefined') updateData.role = payload.role;
  if (typeof payload.isActive !== 'undefined') updateData.isActive = payload.isActive;
  if (typeof payload.password !== 'undefined') {
    updateData.passwordHash = await bcrypt.hash(payload.password, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData
  });

  return sanitizeUser(updated);
};

module.exports = {
  createUser,
  getUsers,
  updateUser
};
