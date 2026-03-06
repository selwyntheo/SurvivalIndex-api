// SFI-v3 Leaderboard Service
// Three-level leaderboard: Tool, Category, Agent
// Plus full computation orchestrator

import prisma from '../config/database.js';
import {
  calculateSurvival,
  deriveTiers,
  deriveTier,
  calculateConfidence,
  DEFAULT_WEIGHTS,
  FORMULA_VERSION,
  FIXED_FALLBACK_THRESHOLDS,
} from './sfiService.js';
import { measureVariables, getToolDataQuality } from './sfiMeasurementService.js';

// ─── Tool Leaderboard ────────────────────────────────────────────────

/**
 * Build tool leaderboard for a specific category.
 */
export async function buildToolLeaderboard(category) {
  const scores = await prisma.toolSurvivalScore.findMany({
    where: { categoryId: { equals: category, mode: 'insensitive' } },
    orderBy: { survivalScore: 'desc' },
    include: {
      tool: {
        select: { id: true, name: true, logo: true, type: true, description: true, url: true, githubUrl: true, tags: true },
      },
    },
  });

  // Deduplicate: keep latest score per tool
  const latestByTool = new Map();
  for (const s of scores) {
    if (!latestByTool.has(s.toolId) || s.computedAt > latestByTool.get(s.toolId).computedAt) {
      latestByTool.set(s.toolId, s);
    }
  }

  const entries = [...latestByTool.values()]
    .sort((a, b) => b.survivalScore - a.survivalScore)
    .map((s, idx) => {
      const isHiddenGem = s.survivalScore > 65 && (s.visibilityRate ?? 1) < 0.30;
      const isOverhyped = (s.visibilityRate ?? 0) > 0.60 && (s.expertEndorsementRate ?? 1) < 0.50;

      return {
        rank: idx + 1,
        toolId: s.toolId,
        toolName: s.tool.name,
        logo: s.tool.logo,
        type: s.tool.type,
        score: s.survivalScore,
        tier: s.survivalTier,
        pickRate: s.pickRate,
        visibilityRate: s.visibilityRate,
        expertEndorsementRate: s.expertEndorsementRate,
        confidence: s.confidence,
        trend: null, // computed below
        isHiddenGem,
        isOverhyped,
        components: {
          savings: s.savingsScore,
          usage: s.usageScore,
          human: s.humanScore,
          awarenessCost: s.awarenessCost,
          frictionCost: s.frictionCost,
        },
      };
    });

  // Calculate trends (30-day delta)
  for (const entry of entries) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldScore = await prisma.toolSurvivalScore.findFirst({
      where: {
        toolId: entry.toolId,
        categoryId: { equals: category, mode: 'insensitive' },
        computedAt: { lt: thirtyDaysAgo },
      },
      orderBy: { computedAt: 'desc' },
      select: { survivalScore: true },
    });

    if (oldScore) {
      entry.trend = Math.round((entry.score - oldScore.survivalScore) * 10) / 10;
    }
  }

  return entries;
}

// ─── Category Leaderboard ────────────────────────────────────────────

/**
 * Build category leaderboard.
 */
export async function buildCategoryLeaderboard() {
  // Get all distinct categories with their latest scores
  const allScores = await prisma.toolSurvivalScore.findMany({
    orderBy: { computedAt: 'desc' },
    include: {
      tool: { select: { name: true } },
    },
  });

  // Group by category, keep latest per tool
  const categories = new Map();
  for (const s of allScores) {
    if (!categories.has(s.categoryId)) {
      categories.set(s.categoryId, new Map());
    }
    const catMap = categories.get(s.categoryId);
    if (!catMap.has(s.toolId) || s.computedAt > catMap.get(s.toolId).computedAt) {
      catMap.set(s.toolId, s);
    }
  }

  const entries = [];
  for (const [categoryId, toolMap] of categories) {
    const tools = [...toolMap.values()];
    if (tools.length === 0) continue;

    // Survival alignment score: weighted avg by pick rate
    const totalPickRate = tools.reduce((sum, t) => sum + (t.pickRate || 0), 0);
    const survivalAlignmentScore = totalPickRate > 0
      ? tools.reduce((sum, t) => sum + t.survivalScore * (t.pickRate || 0), 0) / totalPickRate
      : tools.reduce((sum, t) => sum + t.survivalScore, 0) / tools.length;

    const customDiyRate = tools.reduce((sum, t) => sum + (t.customDiyRateInCategory || 0), 0) / tools.length;
    const dominantTool = tools.sort((a, b) => b.survivalScore - a.survivalScore)[0];
    const isFragmented = tools.length > 1 && (dominantTool.pickRate || 0) < 0.4;
    const hiddenGems = tools.filter(t => t.survivalScore > 65 && (t.visibilityRate ?? 1) < 0.30).length;

    entries.push({
      categoryId,
      survivalAlignmentScore: Math.round(survivalAlignmentScore * 10) / 10,
      customDiyRate: Math.round(customDiyRate * 100) / 100,
      toolCount: tools.length,
      dominantTool: dominantTool.tool.name,
      dominantScore: dominantTool.survivalScore,
      isFragmented,
      hasHiddenGems: hiddenGems,
      trend: null, // TODO: 30-day category trend
    });
  }

  return entries.sort((a, b) => b.survivalAlignmentScore - a.survivalAlignmentScore);
}

// ─── Agent Leaderboard ───────────────────────────────────────────────

/**
 * Build agent comparison leaderboard.
 */
export async function buildAgentLeaderboard() {
  const agents = await prisma.acesObservation.groupBy({
    by: ['agentName'],
    _count: { id: true },
  });

  const entries = [];
  for (const agent of agents) {
    const agentName = agent.agentName;
    const obs = await prisma.acesObservation.findMany({
      where: { agentName },
      include: {
        choiceScores: { orderBy: { computedAt: 'desc' }, take: 1 },
      },
    });

    const withScores = obs.filter(o => o.choiceScores.length > 0);
    const avgChoiceScore = withScores.length > 0
      ? withScores.reduce((sum, o) => sum + o.choiceScores[0].overallScore, 0) / withScores.length
      : null;
    const avgSurvivalAlignment = withScores.length > 0
      ? withScores.reduce((sum, o) => sum + o.choiceScores[0].survivalAlignment, 0) / withScores.length
      : null;

    const expertReviewed = obs.filter(o => o.expertAgreed !== null);
    const expertAgreement = expertReviewed.length > 0
      ? expertReviewed.filter(o => o.expertAgreed).length / expertReviewed.length
      : null;

    const customDiyRate = obs.length > 0
      ? obs.filter(o => o.wasCustomDIY).length / obs.length
      : 0;

    // Consistency: variance in choice scores
    let consistencyScore = null;
    if (withScores.length > 1) {
      const scores = withScores.map(o => o.choiceScores[0].overallScore);
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
      consistencyScore = Math.max(0, 100 - Math.sqrt(variance) * 2);
    }

    // Best/worst categories
    const catGroups = {};
    for (const o of obs) {
      if (!catGroups[o.promptCategory]) catGroups[o.promptCategory] = [];
      catGroups[o.promptCategory].push(o);
    }
    const catScores = Object.entries(catGroups).map(([cat, catObs]) => ({
      category: cat,
      chosenRate: catObs.filter(o => o.wasChosen).length / catObs.length,
    }));
    catScores.sort((a, b) => b.chosenRate - a.chosenRate);

    entries.push({
      agentName,
      observationCount: obs.length,
      avgChoiceScore: avgChoiceScore ? Math.round(avgChoiceScore * 10) / 10 : null,
      survivalAlignment: avgSurvivalAlignment ? Math.round(avgSurvivalAlignment * 10) / 10 : null,
      expertAgreement: expertAgreement !== null ? Math.round(expertAgreement * 100) : null,
      customDiyRate: Math.round(customDiyRate * 100),
      consistencyScore: consistencyScore !== null ? Math.round(consistencyScore * 10) / 10 : null,
      bestCategory: catScores[0]?.category || null,
      worstCategory: catScores[catScores.length - 1]?.category || null,
    });
  }

  return entries.sort((a, b) => (b.avgChoiceScore || 0) - (a.avgChoiceScore || 0));
}

// ─── Tool Detail ─────────────────────────────────────────────────────

/**
 * Get detailed tool info for a specific tool/category.
 */
export async function getToolDetail(toolName, category) {
  const project = await prisma.project.findFirst({
    where: { name: { equals: toolName, mode: 'insensitive' } },
    include: { aiRating: true },
  });

  if (!project) return null;

  const latestScore = await prisma.toolSurvivalScore.findFirst({
    where: {
      toolId: project.id,
      ...(category ? { categoryId: { equals: category, mode: 'insensitive' } } : {}),
    },
    orderBy: { computedAt: 'desc' },
  });

  if (!latestScore) return null;

  // 30-day trend
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const oldScore = await prisma.toolSurvivalScore.findFirst({
    where: {
      toolId: project.id,
      categoryId: latestScore.categoryId,
      computedAt: { lt: thirtyDaysAgo },
    },
    orderBy: { computedAt: 'desc' },
    select: { survivalScore: true },
  });

  // Find bottleneck (lowest scoring positive component or highest cost component)
  const components = {
    savings: { value: latestScore.savingsScore, type: 'positive' },
    usage: { value: latestScore.usageScore, type: 'positive' },
    human: { value: latestScore.humanScore, type: 'positive' },
    awarenessCost: { value: latestScore.awarenessCost, type: 'cost' },
    frictionCost: { value: latestScore.frictionCost, type: 'cost' },
  };

  // Bottleneck: lowest positive or highest cost
  let bottleneck = null;
  let worstImpact = -Infinity;
  for (const [name, comp] of Object.entries(components)) {
    const impact = comp.type === 'positive' ? -comp.value : comp.value;
    if (impact > worstImpact) {
      worstImpact = impact;
      bottleneck = name;
    }
  }

  return {
    toolId: project.id,
    toolName: project.name,
    logo: project.logo,
    category: latestScore.categoryId,
    score: latestScore.survivalScore,
    tier: latestScore.survivalTier,
    confidence: latestScore.confidence,
    trend: oldScore ? Math.round((latestScore.survivalScore - oldScore.survivalScore) * 10) / 10 : null,
    components: {
      savings: latestScore.savingsScore,
      usage: latestScore.usageScore,
      human: latestScore.humanScore,
      awarenessCost: latestScore.awarenessCost,
      frictionCost: latestScore.frictionCost,
    },
    weights: {
      w_s: latestScore.weightSavings,
      w_u: latestScore.weightUsage,
      w_h: latestScore.weightHuman,
      w_a: latestScore.weightAwareness,
      w_f: latestScore.weightFriction,
    },
    bottleneck,
    formula: `exp(${latestScore.weightSavings}*ln(${latestScore.savingsScore}) + ${latestScore.weightUsage}*ln(${latestScore.usageScore}) + ${latestScore.weightHuman}*ln(${latestScore.humanScore}) - ${latestScore.weightAwareness}*ln(${latestScore.awarenessCost}) - ${latestScore.weightFriction}*ln(${latestScore.frictionCost}))`,
    computedAt: latestScore.computedAt,
    dataPoints: latestScore.dataPoints,
    visibilityByModel: latestScore.visibilityByModel || null,
    awarenessDetail: latestScore.awarenessDetail || null,
  };
}

// ─── Computation Orchestrator ────────────────────────────────────────

/**
 * Full recomputation: score all tools, derive tiers, store results.
 */
export async function computeAll() {
  const projects = await prisma.project.findMany({
    include: { aiRating: true },
  });

  const allScores = [];
  const scoreRecords = [];
  const now = new Date();

  for (const project of projects) {
    // Use project.category as the categoryId
    const categoryId = project.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Measure 5 variables (or bootstrap from AI rating)
    // Use the full measureVariables which attempts ACES first, then falls back to AI rating
    const vars = await measureVariables(project.id, categoryId);

    // Calculate survival
    const result = calculateSurvival({
      savings: vars.savings,
      usage: vars.usage,
      human: vars.human,
      awarenessCost: vars.awarenessCost,
      frictionCost: vars.frictionCost,
    });

    allScores.push(result.score);

    scoreRecords.push({
      toolId: project.id,
      categoryId,
      computedAt: now,
      savingsScore: vars.savings,
      usageScore: vars.usage,
      humanScore: vars.human,
      awarenessCost: vars.awarenessCost,
      frictionCost: vars.frictionCost,
      weightSavings: DEFAULT_WEIGHTS.w_s,
      weightUsage: DEFAULT_WEIGHTS.w_u,
      weightHuman: DEFAULT_WEIGHTS.w_h,
      weightAwareness: DEFAULT_WEIGHTS.w_a,
      weightFriction: DEFAULT_WEIGHTS.w_f,
      survivalRatio: result.ratio,
      survivalScore: result.score,
      survivalTier: result.tier, // Will be re-derived after percentile calc
      dataPoints: vars.dataPoints,
      confidence: 0, // Will be set in bootstrap script with more precision
      visibilityByModel: vars.visibilityByModel || null,
      awarenessDetail: vars.awarenessDetail || null,
    });
  }

  // Derive percentile-based tiers
  const thresholds = deriveTiers(allScores);

  // Re-assign tiers based on computed thresholds
  for (const rec of scoreRecords) {
    rec.survivalTier = deriveTier(rec.survivalScore, thresholds);
    rec.tierThresholds = thresholds;
  }

  // Store all scores in a transaction
  await prisma.$transaction(async (tx) => {
    // Upsert scores (delete existing for same timestamp, then create)
    for (const rec of scoreRecords) {
      await tx.toolSurvivalScore.create({ data: rec });
    }

    // Store tier thresholds
    for (const [tierName, bounds] of Object.entries(thresholds)) {
      const tierDef = [
        { name: 'legendary', floor: 95 },
        { name: 'strong', floor: 75 },
        { name: 'competitive', floor: 40 },
        { name: 'pressured', floor: 15 },
        { name: 'endangered', floor: 0 },
      ].find(t => t.name === tierName);

      await tx.tierThreshold.create({
        data: {
          computedAt: now,
          tier: tierName,
          percentileFloor: tierDef?.floor ?? 0,
          scoreMin: bounds.min,
          scoreMax: bounds.max,
          toolCount: scoreRecords.filter(r => r.survivalTier === tierName).length,
        },
      });
    }

    // Store weight calibration record
    await tx.weightCalibration.create({
      data: {
        calibratedAt: now,
        wSavings: DEFAULT_WEIGHTS.w_s,
        wUsage: DEFAULT_WEIGHTS.w_u,
        wHuman: DEFAULT_WEIGHTS.w_h,
        wAwareness: DEFAULT_WEIGHTS.w_a,
        wFriction: DEFAULT_WEIGHTS.w_f,
        trainingSamples: projects.length,
        notes: `Initial SFI-v3 computation with ${projects.length} projects`,
      },
    });
  });

  return {
    version: FORMULA_VERSION,
    projectsScored: scoreRecords.length,
    thresholds,
    tierDistribution: Object.fromEntries(
      Object.keys(thresholds).map(t => [t, scoreRecords.filter(r => r.survivalTier === t).length])
    ),
  };
}

// ─── Utility ─────────────────────────────────────────────────────────

/**
 * Get all distinct categories with tool counts.
 */
export async function getCategories() {
  const scores = await prisma.toolSurvivalScore.findMany({
    select: { categoryId: true, toolId: true },
    orderBy: { computedAt: 'desc' },
  });

  // Deduplicate: latest per tool+category
  const seen = new Set();
  const categories = new Map();
  for (const s of scores) {
    const key = `${s.toolId}:${s.categoryId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    categories.set(s.categoryId, (categories.get(s.categoryId) || 0) + 1);
  }

  return [...categories.entries()]
    .map(([categoryId, toolCount]) => ({ categoryId, toolCount }))
    .sort((a, b) => b.toolCount - a.toolCount);
}

/**
 * Get current tier thresholds (most recent computation).
 */
export async function getCurrentTiers() {
  const latest = await prisma.tierThreshold.findFirst({
    orderBy: { computedAt: 'desc' },
    select: { computedAt: true },
  });

  if (!latest) return FIXED_FALLBACK_THRESHOLDS;

  const thresholds = await prisma.tierThreshold.findMany({
    where: { computedAt: latest.computedAt },
    orderBy: { percentileFloor: 'desc' },
  });

  const result = {};
  for (const t of thresholds) {
    result[t.tier] = {
      min: t.scoreMin,
      max: t.scoreMax,
      toolCount: t.toolCount,
      percentileFloor: t.percentileFloor,
    };
  }
  return result;
}

export default {
  buildToolLeaderboard,
  buildCategoryLeaderboard,
  buildAgentLeaderboard,
  getToolDetail,
  computeAll,
  getCategories,
  getCurrentTiers,
};
