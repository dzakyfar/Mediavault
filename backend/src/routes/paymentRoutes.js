const express = require('express');
const {
  createProjectPayment,
  getProjectPayment,
  listMyPayments,
  checkPaymentStatus,
  handleKlikqrisWebhook,
} = require('../controllers/paymentController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/webhook/klikqris', handleKlikqrisWebhook);
router.get('/mine', protect, listMyPayments);
router.post('/projects/:projectId/create', protect, requireRole('CLIENT', 'BOTH'), createProjectPayment);
router.get('/projects/:projectId/current', protect, getProjectPayment);
router.get('/:klikqrisOrderId/status', protect, checkPaymentStatus);

module.exports = router;
