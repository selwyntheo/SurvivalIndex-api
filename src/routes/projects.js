import express from 'express';
import projectService from '../services/projectService.js';

const router = express.Router();

/**
 * GET /api/projects
 * Get all projects with optional filters and pagination
 * Query params: type, category, minScore, maxScore, page, limit
 */
router.get('/', async (req, res, next) => {
  try {
    const { type, category, minScore, maxScore, page, limit } = req.query;
    const result = await projectService.getAllProjects({
      type,
      category,
      minScore,
      maxScore,
      page,
      limit
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/leaderboard
 * Get projects sorted by survival score
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const leaderboard = await projectService.getLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:id
 * Get single project by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/projects/:id
 * Update project
 */
router.put('/:id', async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
