const asyncHandler = require('../utils/asyncHandler');
const appError = require('../utils/appError');
const { bootstrapAdmin } = require('../services/bootstrapService');

/**
 * POST /admin/bootstrap
 * Manually trigger bootstrap admin creation
 */
const bootstrapAdminAccount = asyncHandler(async (req, res) => {
  const result = await bootstrapAdmin();

  if (result.userCreated) {
    return res.status(201).json({
      success: true,
      message: 'Bootstrap admin account created.',
      data: {
        user: result.user
      }
    });
  }

  // Admin already exists
  throw new appError('An admin account already exists.', 409, 'ADMIN_EXISTS');
});

module.exports = {
  bootstrapAdminAccount
};
