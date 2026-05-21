const express = require('express');
const { listMessages, sendMessage, markMessagesRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, listMessages);
router.post('/', protect, sendMessage);
router.patch('/read', protect, markMessagesRead);

module.exports = router;
