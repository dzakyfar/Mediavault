const express = require('express');
const { listMessages, getUnreadMessageCount, sendMessage, markMessagesRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/unread-count', protect, getUnreadMessageCount);
router.get('/', protect, listMessages);
router.post('/', protect, sendMessage);
router.patch('/read', protect, markMessagesRead);

module.exports = router;
