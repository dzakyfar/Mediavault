const express = require('express');
const {
  listMyProjects,
  createProject,
  updateProject,
  deleteProject,
  listOpenProjects,
  getProjectById,
  updateProjectProgress,
  applyToProject,
  respondToApplication,
} = require('../controllers/projectController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/mine', protect, listMyProjects);
router.post('/', protect, requireRole('CLIENT', 'BOTH'), createProject);
router.get('/open', protect, requireRole('FREELANCER', 'BOTH'), listOpenProjects);
router.get('/:projectId', protect, getProjectById);
router.patch('/:projectId', protect, requireRole('CLIENT', 'BOTH'), updateProject);
router.delete('/:projectId', protect, requireRole('CLIENT', 'BOTH'), deleteProject);
router.patch('/:projectId/progress', protect, updateProjectProgress);
router.post('/:projectId/apply', protect, requireRole('FREELANCER', 'BOTH'), applyToProject);
router.patch('/applications/:applicationId', protect, requireRole('CLIENT', 'BOTH'), respondToApplication);

module.exports = router;
