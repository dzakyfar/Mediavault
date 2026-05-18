const express = require('express');
const { listMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, listMessages);

module.exports = router;
