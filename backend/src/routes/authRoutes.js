const express = require('express');
const {
  register,
  login,
  googleLogin,
  me,
  updateRole,
  updateProfile,
  registerFreelancer,
  changePassword,
  deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, me);
router.patch('/role', protect, updateRole);
router.patch('/profile', protect, updateProfile);
router.post('/freelancer-registration', protect, registerFreelancer);
router.post('/register-freelancer', protect, registerFreelancer);
router.patch('/password', protect, changePassword);
router.delete('/me', protect, deleteAccount);

module.exports = router;
