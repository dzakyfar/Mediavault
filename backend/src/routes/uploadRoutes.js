const express = require('express');
const { createUploadUrl, getDownloadUrl } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/presign', protect, createUploadUrl);
router.get('/download-url', protect, getDownloadUrl);

module.exports = router;
