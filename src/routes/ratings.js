import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

/**
 * POST /api/ratings
 * Submit a user rating for a project
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      projectId,
      insightCompression,
      substrateEfficiency,
      broadUtility,
      awareness,
      agentFriction,
      humanCoefficient,
      userId
    } = req.body;

    // Validate scores
    const scores = [
      insightCompression,
      substrateEfficiency,
      broadUtility,
      awareness,
      agentFriction,
      humanCoefficient
    ];

    for (const score of scores) {
      if (score < 0 || score > 10) {
        return res.status(400).json({
          error: 'All scores must be between 0 and 10'
        });
      }
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Create user rating
    const rating = await prisma.userRating.create({
      data: {
        projectId: parseInt(projectId),
        insightCompression,
        substrateEfficiency,
        broadUtility,
        awareness,
        agentFriction,
        humanCoefficient,
        userId,
        ipAddress: req.ip
      }
    });

    res.status(201).json(rating);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ratings/:projectId
 * Get all user ratings for a project
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const ratings = await prisma.userRating.findMany({
      where: {
        projectId: parseInt(req.params.projectId)
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(ratings);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ratings/:projectId/average
 * Get average user ratings for a project
 */
router.get('/:projectId/average', async (req, res, next) => {
  try {
    const ratings = await prisma.userRating.findMany({
      where: {
        projectId: parseInt(req.params.projectId)
      }
    });

    if (ratings.length === 0) {
      return res.json({
        count: 0,
        averages: null
      });
    }

    const averages = {
      insightCompression: ratings.reduce((sum, r) => sum + r.insightCompression, 0) / ratings.length,
      substrateEfficiency: ratings.reduce((sum, r) => sum + r.substrateEfficiency, 0) / ratings.length,
      broadUtility: ratings.reduce((sum, r) => sum + r.broadUtility, 0) / ratings.length,
      awareness: ratings.reduce((sum, r) => sum + r.awareness, 0) / ratings.length,
      agentFriction: ratings.reduce((sum, r) => sum + r.agentFriction, 0) / ratings.length,
      humanCoefficient: ratings.reduce((sum, r) => sum + r.humanCoefficient, 0) / ratings.length
    };

    res.json({
      count: ratings.length,
      averages
    });
  } catch (error) {
    next(error);
  }
});

export default router;
