const express = require('express');
const { createUploadUrl, getDownloadUrl, uploadDirect, proxyDownload } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/presign', protect, createUploadUrl);
router.post('/direct', protect, uploadDirect);
router.get('/download-url', protect, getDownloadUrl);
router.get('/proxy-download', protect, proxyDownload);

module.exports = router;
