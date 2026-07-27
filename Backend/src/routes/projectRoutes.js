/* ==========================================================================
   IDENTIFICATION: BACKEND - PROJECT ROUTES
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   DESCRIPTION: REST API endpoints for project management
   ========================================================================== */

const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// GET: All Projects (with role-based filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await ProjectController.getProjects(
      req.user.id,
      req.user.role,
      req.query
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// GET: Project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await ProjectController.getProjectById(req.params.id);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// POST: Create Project
router.post('/', authenticateToken, authorizeRole('student', 'supervisor', 'admin'), async (req, res) => {
  try {
    const { studentId, supervisorId, title, description, startDate, endDate } = req.body;

    if (!studentId || !supervisorId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: studentId, supervisorId, title'
      });
    }

    const result = await ProjectController.createProject(
      studentId,
      supervisorId,
      { title, description, startDate, endDate }
    );

    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// PUT: Update Project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await ProjectController.updateProject(req.params.id, req.body);
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// DELETE: Project
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await ProjectController.deleteProject(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

module.exports = router;
