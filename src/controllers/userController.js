const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body, req.user);

  res.status(201).json({
    success: true,
    message: 'User created',
    data: user
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getUsers();

  res.status(200).json({
    success: true,
    data: users
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user);

  res.status(200).json({
    success: true,
    message: 'User updated',
    data: user
  });
});

module.exports = {
  createUser,
  getUsers,
  updateUser
};
