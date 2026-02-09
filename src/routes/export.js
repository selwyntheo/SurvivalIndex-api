import express from 'express';
import exportService from '../services/exportService.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/export/projects
 * Get all projects as JSONL
 */
router.get('/projects', async (req, res, next) => {
  try {
    const result = await exportService.exportProjects();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/ai-ratings
 * Get all AI ratings as JSONL
 */
router.get('/ai-ratings', async (req, res, next) => {
  try {
    const result = await exportService.exportAIRatings();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/community-ratings
 * Get all community ratings as JSONL
 */
router.get('/community-ratings', async (req, res, next) => {
  try {
    const result = await exportService.exportCommunityRatings();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/submissions
 * Get pending submissions as JSONL
 */
router.get('/submissions', async (req, res, next) => {
  try {
    const result = await exportService.exportSubmissions();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/export/generate
 * Generate all JSONL exports (Admin only)
 */
router.post('/generate', requireAdmin, async (req, res, next) => {
  try {
    const result = await exportService.exportAll();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/stats
 * Get export statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await exportService.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;
