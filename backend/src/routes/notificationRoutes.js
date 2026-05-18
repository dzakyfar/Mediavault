const express = require('express');
const { listNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, listNotifications);

module.exports = router;
