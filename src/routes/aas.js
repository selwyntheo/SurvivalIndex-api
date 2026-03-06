import { Router } from 'express';
import prisma from '../config/database.js';
import { requireAdmin } from '../middleware/auth.js';
import { computeAllAAS } from '../services/aasService.js';
import { computeRealAAS } from '../services/aasComputeService.js';
import {
  buildCategoryLeaderboard,
  buildToolLeaderboard,
  getToolDetail,
  getHiddenGems,
  getCategories,
} from '../services/aasLeaderboardService.js';
import {
  AWARENESS_THRESHOLD,
  PROMPT_WEIGHTS,
  GEM_OFFSET,
  MIN_SAMPLE_SIZE,
  AAS_CATEGORIES,
} from '../services/aasConstants.js';

const router = Router();

// GET /api/aas/leaderboard — Category leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const categories = await buildCategoryLeaderboard();
    res.json({ categories });
  } catch (err) {
    console.error('AAS leaderboard error:', err);
    res.status(500).json({ error: 'Failed to build leaderboard' });
  }
});

// GET /api/aas/leaderboard/:category — Tool leaderboard for category
router.get('/leaderboard/:category', async (req, res) => {
  try {
    const tools = await buildToolLeaderboard(req.params.category);
    res.json({ category: req.params.category, tools });
  } catch (err) {
    console.error('AAS category leaderboard error:', err);
    res.status(500).json({ error: 'Failed to build tool leaderboard' });
  }
});

// GET /api/aas/tool/:toolName — Tool AAS detail
router.get('/tool/:toolName', async (req, res) => {
  try {
    const detail = await getToolDetail(req.params.toolName, req.query.category);
    if (!detail) {
      return res.status(404).json({ error: 'Tool not found or no AAS data' });
    }
    res.json(detail);
  } catch (err) {
    console.error('AAS tool detail error:', err);
    res.status(500).json({ error: 'Failed to get tool detail' });
  }
});

// GET /api/aas/tool/:toolName/models — Per-model breakdown
router.get('/tool/:toolName/models', async (req, res) => {
  try {
    const detail = await getToolDetail(req.params.toolName, req.query.category);
    if (!detail) {
      return res.status(404).json({ error: 'Tool not found or no AAS data' });
    }
    res.json({ toolName: detail.toolName, modelScores: detail.modelScores });
  } catch (err) {
    console.error('AAS model breakdown error:', err);
    res.status(500).json({ error: 'Failed to get model breakdown' });
  }
});

// GET /api/aas/hidden-gems — All hidden gems
router.get('/hidden-gems', async (req, res) => {
  try {
    const gems = await getHiddenGems();
    res.json({ gems });
  } catch (err) {
    console.error('AAS hidden gems error:', err);
    res.status(500).json({ error: 'Failed to get hidden gems' });
  }
});

// GET /api/aas/hidden-gems/:category — Category hidden gems
router.get('/hidden-gems/:category', async (req, res) => {
  try {
    const gems = await getHiddenGems(req.params.category);
    res.json({ category: req.params.category, gems });
  } catch (err) {
    console.error('AAS category hidden gems error:', err);
    res.status(500).json({ error: 'Failed to get hidden gems' });
  }
});

// GET /api/aas/categories — 25 categories with tool counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json({ categories });
  } catch (err) {
    console.error('AAS categories error:', err);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// GET /api/aas/version — AAS version info
router.get('/version', (req, res) => {
  res.json({
    version: '3.0',
    name: 'Agent Awareness Score (AAS)',
    description: 'Geometric mean of per-model pick rates, 0-100 scale',
    parameters: {
      awarenessThreshold: AWARENESS_THRESHOLD,
      promptWeights: PROMPT_WEIGHTS,
      gemOffset: GEM_OFFSET,
      minSampleSize: MIN_SAMPLE_SIZE,
    },
    categories: AAS_CATEGORIES.length,
    hiddenGemThresholds: {
      strongGem: '+30 gap',
      mildGem: '+15 gap',
      aligned: '-15 to +15',
      mildlyOverhyped: '-30 to -15',
      overhyped: '< -30',
    },
  });
});

// POST /api/aas/compute — Trigger bootstrap recomputation (admin only)
router.post('/compute', requireAdmin, async (req, res) => {
  try {
    const results = await computeAllAAS();
    res.json({
      message: `Computed AAS for ${results.length} tool-category pairs`,
      count: results.length,
    });
  } catch (err) {
    console.error('AAS computation error:', err);
    res.status(500).json({ error: 'Failed to compute AAS scores' });
  }
});

// POST /api/aas/compute-real — Trigger real multi-model AAS computation (admin only)
// This runs in the background since it makes hundreds of API calls (~5-15 min)
router.post('/compute-real', requireAdmin, async (req, res) => {
  const { categories, dryRun } = req.body || {};

  // Clear old scores first (unless dry run)
  if (!dryRun) {
    const deleted = await prisma.aasScore.deleteMany({});
    console.log(`Cleared ${deleted.count} old AAS scores.`);
  }

  // Respond immediately — computation runs in background
  res.json({
    message: 'Real AAS computation started in background',
    dryRun: !!dryRun,
    categories: categories || 'all',
  });

  // Run computation asynchronously
  try {
    const results = await computeRealAAS({ dryRun: !!dryRun, categories: categories || null });
    console.log(`Real AAS computation complete: ${results.length} tools scored.`);
  } catch (err) {
    console.error('Real AAS computation failed:', err);
  }
});

// POST /api/aas/executions — Record agent execution + extraction (admin only)
router.post('/executions', requireAdmin, async (req, res) => {
  try {
    const {
      agentName, modelName, repositoryType, categoryId, promptType,
      promptText, responseText, executionTimeMs,
      primaryToolId, isCustomDiy, reasoning, confidence, considerationSet,
    } = req.body;

    if (!agentName || !modelName || !repositoryType || !categoryId || !promptType || !promptText) {
      return res.status(400).json({ error: 'Missing required fields: agentName, modelName, repositoryType, categoryId, promptType, promptText' });
    }

    const execution = await prisma.agentExecution.create({
      data: {
        agentName,
        modelName,
        repositoryType,
        categoryId,
        promptType,
        promptText,
        responseText,
        executionTimeMs,
        extraction: (primaryToolId || isCustomDiy) ? {
          create: {
            primaryToolId: primaryToolId || null,
            isCustomDiy: isCustomDiy || false,
            reasoning,
            confidence,
            considerationSet: considerationSet || null,
          },
        } : undefined,
      },
      include: { extraction: true },
    });

    res.status(201).json(execution);
  } catch (err) {
    console.error('AAS execution record error:', err);
    res.status(500).json({ error: 'Failed to record execution' });
  }
});

// POST /api/aas/expert-evaluations — Submit expert evaluation (admin only)
router.post('/expert-evaluations', requireAdmin, async (req, res) => {
  try {
    const {
      toolId, categoryId, evaluatorId,
      wouldYouUse, contextNotes,
      appropriateness, productionReadiness, longTermViability,
    } = req.body;

    if (!toolId || !categoryId || !evaluatorId || !wouldYouUse) {
      return res.status(400).json({ error: 'Missing required fields: toolId, categoryId, evaluatorId, wouldYouUse' });
    }

    if (!['yes', 'no', 'depends'].includes(wouldYouUse)) {
      return res.status(400).json({ error: 'wouldYouUse must be: yes, no, or depends' });
    }

    const evaluation = await prisma.expertEvaluation.create({
      data: {
        toolId: parseInt(toolId),
        categoryId,
        evaluatorId,
        wouldYouUse,
        contextNotes,
        appropriateness: appropriateness ? parseInt(appropriateness) : null,
        productionReadiness: productionReadiness ? parseInt(productionReadiness) : null,
        longTermViability: longTermViability ? parseInt(longTermViability) : null,
      },
    });

    res.status(201).json(evaluation);
  } catch (err) {
    console.error('AAS expert evaluation error:', err);
    res.status(500).json({ error: 'Failed to submit expert evaluation' });
  }
});

export default router;
