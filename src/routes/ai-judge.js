import express from 'express';
import aiJudgeService from '../services/aiJudgeService.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/ai-judge/evaluate/:projectId
 * Trigger AI evaluation for a specific project
 * REQUIRES: Admin authentication
 */
router.post('/evaluate/:projectId', requireAdmin, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const result = await aiJudgeService.evaluateAndStoreProject(projectId);

    res.json({
      success: true,
      project: result.project,
      aiRating: result.aiRating,
      message: `Project "${result.project.name}" evaluated successfully`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai-judge/batch-evaluate
 * Evaluate multiple projects
 * Body: { projectIds: [1, 2, 3] }
 * REQUIRES: Admin authentication
 */
router.post('/batch-evaluate', requireAdmin, async (req, res, next) => {
  try {
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({
        error: 'projectIds must be a non-empty array'
      });
    }

    const result = await aiJudgeService.batchEvaluate(projectIds);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai-judge/reevaluate-stale
 * Re-evaluate projects with outdated ratings
 * Query param: daysOld (default: 30)
 * REQUIRES: Admin authentication
 */
router.post('/reevaluate-stale', requireAdmin, async (req, res, next) => {
  try {
    const daysOld = parseInt(req.query.daysOld) || 30;
    const result = await aiJudgeService.reevaluateStaleProjects(daysOld);

    res.json({
      message: `Re-evaluation complete`,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
