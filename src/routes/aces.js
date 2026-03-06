import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import acesService from '../services/acesService.js';

const router = express.Router();

/**
 * POST /api/aces/observations
 * Submit an agent choice observation (public)
 */
router.post('/observations', async (req, res, next) => {
  try {
    const { projectId, agentName, promptCategory, promptText, wasChosen, alternativeChosen, wasCustomDIY, sessionId, source } = req.body;

    if (!projectId || !agentName || !promptCategory || wasChosen === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, agentName, promptCategory, wasChosen'
      });
    }

    const observation = await acesService.recordObservation({
      projectId,
      agentName,
      promptCategory,
      promptText,
      wasChosen,
      alternativeChosen,
      wasCustomDIY: wasCustomDIY || false,
      sessionId,
      source
    });

    res.status(201).json(observation);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/aces/metrics/:projectId
 * Get ACES metrics for a project (public)
 */
router.get('/metrics/:projectId', async (req, res, next) => {
  try {
    const metric = await acesService.getMetrics(req.params.projectId);

    if (!metric) {
      return res.json({ metric: null, acesScore: null });
    }

    const acesScore = acesService.calculateAcesScore(metric);
    res.json({ metric, acesScore });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/aces/metrics
 * Get all project ACES metrics (public)
 */
router.get('/metrics', async (req, res, next) => {
  try {
    const metrics = await acesService.getAllMetrics();
    const withScores = metrics.map(metric => ({
      ...metric,
      acesScore: acesService.calculateAcesScore(metric)
    }));
    res.json(withScores);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/aces/observations/:id/review
 * Expert review an observation (admin only)
 */
router.post('/observations/:id/review', requireAdmin, async (req, res, next) => {
  try {
    const { expertAgreed } = req.body;

    if (expertAgreed === undefined) {
      return res.status(400).json({ error: 'Missing required field: expertAgreed' });
    }

    const observation = await acesService.recordExpertReview(
      req.params.id,
      {
        expertAgreed,
        expertReviewedBy: req.user.email
      }
    );

    res.json(observation);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/aces/aggregate/:projectId
 * Trigger ACES metric aggregation for a project (admin only)
 */
router.post('/aggregate/:projectId', requireAdmin, async (req, res, next) => {
  try {
    const metric = await acesService.aggregateMetrics(req.params.projectId);

    if (!metric) {
      return res.status(404).json({ error: 'No observations found for this project' });
    }

    const acesScore = acesService.calculateAcesScore(metric);
    res.json({ metric, acesScore });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/aces/aggregate
 * Trigger ACES metric aggregation for all projects (admin only)
 */
router.post('/aggregate', requireAdmin, async (req, res, next) => {
  try {
    const metrics = await acesService.aggregateAllMetrics();
    const withScores = metrics.map(metric => ({
      ...metric,
      acesScore: acesService.calculateAcesScore(metric)
    }));
    res.json({
      aggregated: withScores.length,
      metrics: withScores
    });
  } catch (error) {
    next(error);
  }
});

export default router;
