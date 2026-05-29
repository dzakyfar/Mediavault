const express = require('express');
const {
  createTelegramConnect,
  disconnectTelegram,
  getTelegramStatus,
  syncTelegramPendingUpdates,
  telegramWebhook,
  updateTelegramSettings,
} = require('../controllers/telegramController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/webhook', telegramWebhook);
router.get('/status', protect, getTelegramStatus);
router.post('/connect', protect, createTelegramConnect);
router.post('/sync-pending', protect, syncTelegramPendingUpdates);
router.patch('/settings', protect, updateTelegramSettings);
router.delete('/disconnect', protect, disconnectTelegram);

module.exports = router;
