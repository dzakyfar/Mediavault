const express = require('express');
const {
  listMyOfferings,
  createOffering,
  updateOffering,
  deleteOffering,
} = require('../controllers/offeringController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/mine', protect, requireRole('FREELANCER', 'BOTH'), listMyOfferings);
router.post('/', protect, requireRole('FREELANCER', 'BOTH'), createOffering);
router.patch('/:id', protect, requireRole('FREELANCER', 'BOTH'), updateOffering);
router.delete('/:id', protect, requireRole('FREELANCER', 'BOTH'), deleteOffering);

module.exports = router;
