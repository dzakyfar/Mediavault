const express = require('express');
const {
  listMyPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} = require('../controllers/portfolioController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/mine', protect, requireRole('FREELANCER', 'BOTH'), listMyPortfolio);
router.post('/', protect, requireRole('FREELANCER', 'BOTH'), createPortfolioItem);
router.patch('/:id', protect, requireRole('FREELANCER', 'BOTH'), updatePortfolioItem);
router.delete('/:id', protect, requireRole('FREELANCER', 'BOTH'), deletePortfolioItem);

module.exports = router;
