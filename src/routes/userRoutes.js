const express = require('express');

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createUserSchema, updateUserSchema, idParamSchema } = require('../utils/validationSchemas');

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorize('ADMIN'), userController.getUsers);
router.post('/', authorize('ADMIN'), validate(createUserSchema), userController.createUser);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), userController.updateUser);

module.exports = router;
