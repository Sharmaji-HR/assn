const express = require('express');
const { bootstrapAdminAccount } = require('../controllers/adminController');

const router = express.Router();

/**
 * @route   POST /admin/bootstrap
 * @desc    Manually trigger bootstrap admin account creation
 * @access  Public (for initial setup, should be secured in production)
 * @returns 201/400/409
 */
router.post('/bootstrap', bootstrapAdminAccount);

module.exports = router;
