const express = require('express');

const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/rbacMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(authorize('ANALYST', 'ADMIN'));

router.get('/summary', dashboardController.getSummary);
router.get('/trends', dashboardController.getTrends);

module.exports = router;
