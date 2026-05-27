const express = require('express');
const { createWithdrawal, getEscrowOverview, getMyWallet } = require('../controllers/walletController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, getMyWallet);
router.get('/escrow', protect, requireRole('ADMIN'), getEscrowOverview);
router.post('/withdrawals', protect, requireRole('CLIENT', 'FREELANCER', 'BOTH'), createWithdrawal);

module.exports = router;
