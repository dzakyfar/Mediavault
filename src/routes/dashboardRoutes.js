const express = require('express');
const { getClientDashboard, getFreelancerDashboard } = require('../controllers/dashboardController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/client', protect, requireRole('CLIENT', 'BOTH'), getClientDashboard);
router.get('/freelancer', protect, requireRole('FREELANCER', 'BOTH'), getFreelancerDashboard);

module.exports = router;
