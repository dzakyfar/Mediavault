const express = require('express');
const {
  createProjectPayment,
  payProjectWithWallet,
  getProjectPayment,
  getPaymentDetail,
  listMyPayments,
  checkPaymentStatus,
  handleKlikqrisWebhook,
} = require('../controllers/paymentController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/webhook/klikqris', handleKlikqrisWebhook);
router.get('/mine', protect, listMyPayments);
router.get('/detail/:paymentId', protect, getPaymentDetail);
router.post('/projects/:projectId/create', protect, requireRole('CLIENT', 'BOTH'), createProjectPayment);
router.post('/projects/:projectId/pay-with-wallet', protect, requireRole('CLIENT', 'BOTH'), payProjectWithWallet);
router.get('/projects/:projectId/current', protect, getProjectPayment);
router.get('/:klikqrisOrderId/status', protect, checkPaymentStatus);

module.exports = router;
