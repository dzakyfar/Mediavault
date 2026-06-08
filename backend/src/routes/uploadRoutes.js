const express = require('express');
const { createUploadUrl, getDownloadUrl, uploadDirect } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/presign', protect, createUploadUrl);
router.post('/direct', protect, uploadDirect);
router.get('/download-url', protect, getDownloadUrl);

module.exports = router;
