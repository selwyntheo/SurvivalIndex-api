// SFI-v3 API Routes

import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import {
  buildToolLeaderboard,
  buildCategoryLeaderboard,
  buildAgentLeaderboard,
  getToolDetail,
  computeAll,
  getCategories,
  getCurrentTiers,
} from '../services/sfiLeaderboardService.js';
import { FORMULA_VERSION, DEFAULT_WEIGHTS } from '../services/sfiService.js';

const router = express.Router();

// GET /api/sfi/leaderboard/tools?category=databases
router.get('/leaderboard/tools', async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ error: 'category query parameter is required' });
    }
    const entries = await buildToolLeaderboard(category);
    res.json({ category, tools: entries, count: entries.length });
  } catch (error) {
    console.error('Error building tool leaderboard:', error);
    res.status(500).json({ error: 'Failed to build tool leaderboard' });
  }
});

// GET /api/sfi/leaderboard/categories
router.get('/leaderboard/categories', async (req, res) => {
  try {
    const entries = await buildCategoryLeaderboard();
    res.json({ categories: entries, count: entries.length });
  } catch (error) {
    console.error('Error building category leaderboard:', error);
    res.status(500).json({ error: 'Failed to build category leaderboard' });
  }
});

// GET /api/sfi/leaderboard/agents
router.get('/leaderboard/agents', async (req, res) => {
  try {
    const entries = await buildAgentLeaderboard();
    res.json({ agents: entries, count: entries.length });
  } catch (error) {
    console.error('Error building agent leaderboard:', error);
    res.status(500).json({ error: 'Failed to build agent leaderboard' });
  }
});

// GET /api/sfi/tool/:toolName?category=databases
router.get('/tool/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const { category } = req.query;
    const detail = await getToolDetail(toolName, category);
    if (!detail) {
      return res.status(404).json({ error: 'Tool not found or no SFI score computed' });
    }
    res.json(detail);
  } catch (error) {
    console.error('Error getting tool detail:', error);
    res.status(500).json({ error: 'Failed to get tool detail' });
  }
});

// GET /api/sfi/tiers
router.get('/tiers', async (req, res) => {
  try {
    const tiers = await getCurrentTiers();
    res.json({ tiers });
  } catch (error) {
    console.error('Error getting tiers:', error);
    res.status(500).json({ error: 'Failed to get tier thresholds' });
  }
});

// GET /api/sfi/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json({ categories, count: categories.length });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// GET /api/sfi/version
router.get('/version', async (req, res) => {
  res.json({
    formulaVersion: FORMULA_VERSION,
    weights: DEFAULT_WEIGHTS,
    dataWindow: '90 days',
    description: 'Log-linear survival formula with 5 independent variables',
  });
});

// POST /api/sfi/compute — admin only
router.post('/compute', requireAdmin, async (req, res) => {
  try {
    const result = await computeAll();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error computing SFI scores:', error);
    res.status(500).json({ error: 'Failed to compute SFI scores' });
  }
});

export default router;
