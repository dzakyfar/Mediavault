const express = require('express');
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCountByContext,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, listNotifications);
router.get('/unread-count', protect, getUnreadCountByContext);
router.patch('/read-all', protect, markAllNotificationsRead);
router.patch('/:notificationId/read', protect, markNotificationRead);

module.exports = router;
