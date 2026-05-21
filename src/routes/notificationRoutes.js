const express = require('express');
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, listNotifications);
router.patch('/read-all', protect, markAllNotificationsRead);
router.patch('/:notificationId/read', protect, markNotificationRead);

module.exports = router;
