const express = require('express');
const { register, login, me, updateRole, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.patch('/role', protect, updateRole);
router.patch('/profile', protect, updateProfile);

module.exports = router;
