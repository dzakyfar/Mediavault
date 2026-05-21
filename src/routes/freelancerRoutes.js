const express = require('express');
const {
  listFreelancers,
  getFreelancerById,
  orderFreelancerService,
} = require('../controllers/freelancerController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', listFreelancers);
router.get('/:id', getFreelancerById);
router.post('/:id/order', protect, requireRole('CLIENT', 'BOTH'), orderFreelancerService);

module.exports = router;
