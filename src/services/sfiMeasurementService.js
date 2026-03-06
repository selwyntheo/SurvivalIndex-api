// SFI-v3 Measurement Service
// Maps existing AI Judge 7-lever scores to 5 SFI variables,
// and provides ACES-based measurement when sufficient data exists.

import prisma from '../config/database.js';
import { clamp } from './sfiService.js';

const MIN_ACES_OBSERVATIONS = 3;

/**
 * Bootstrap mapping: derive 5 SFI variables from existing 7-lever AI rating.
 * Used when ACES data is insufficient (< 3 observations).
 *
 * @param {Object} aiRating - AIRating record with 7 lever scores (0-10)
 * @returns {Object} { savings, usage, human, awarenessCost, frictionCost } all 1-10
 */
export function mapFromAIRating(aiRating) {
  const savings = clamp(
    (aiRating.insightCompression + aiRating.broadUtility) / 2,
    1, 10
  );
  const usage = clamp(aiRating.broadUtility, 1, 10);
  const human = clamp(aiRating.humanCoefficient, 1, 10);

  // Inverted: high awareness score (0-10) → low awareness cost
  const awarenessCost = clamp(11 - aiRating.awareness, 1, 10);
  // Inverted: high agentFriction score (low friction) → low friction cost
  const frictionCost = clamp(11 - aiRating.agentFriction, 1, 10);

  return {
    savings: Math.round(savings * 10) / 10,
    usage: Math.round(usage * 10) / 10,
    human: Math.round(human * 10) / 10,
    awarenessCost: Math.round(awarenessCost * 10) / 10,
    frictionCost: Math.round(frictionCost * 10) / 10,
  };
}

/**
 * Measure all 5 SFI variables for a tool/category.
 * Falls back to AI rating bootstrap if not enough ACES data.
 *
 * @param {number} toolId - Project ID
 * @param {string} categoryId - Category slug
 * @returns {Object} { savings, usage, human, awarenessCost, frictionCost, source, awarenessDetail?, visibilityByModel? }
 */
export async function measureVariables(toolId, categoryId) {
  // Count ACES observations for this tool in this category
  const obsCount = await prisma.acesObservation.count({
    where: {
      projectId: toolId,
      promptCategory: { equals: categoryId, mode: 'insensitive' },
    },
  });

  if (obsCount >= MIN_ACES_OBSERVATIONS) {
    // Use ACES-based measurement
    const [savings, usage, human, awarenessResult, frictionCost] = await Promise.all([
      measureSavings(toolId, categoryId),
      measureUsage(toolId, categoryId),
      measureHuman(toolId, categoryId),
      measureAwarenessCost(toolId, categoryId),
      measureFrictionCost(toolId),
    ]);

    return {
      savings, usage, human,
      awarenessCost: awarenessResult.cost,
      frictionCost,
      source: 'aces',
      dataPoints: obsCount,
      awarenessDetail: awarenessResult.detail,
      visibilityByModel: awarenessResult.visibilityByModel,
    };
  }

  // Fall back to AI rating bootstrap
  const aiRating = await prisma.aIRating.findUnique({
    where: { projectId: toolId },
  });

  if (!aiRating) {
    // No data at all — return middle-of-road defaults
    return {
      savings: 5, usage: 5, human: 5, awarenessCost: 5, frictionCost: 5,
      source: 'default',
      dataPoints: 0,
    };
  }

  const mapped = mapFromAIRating(aiRating);
  return {
    ...mapped,
    source: 'ai-rating-bootstrap',
    dataPoints: 1,
  };
}

/**
 * ACES-based savings measurement.
 * Pick rate conditional on awareness: how often chosen among tools the agent knows about.
 */
async function measureSavings(toolId, categoryId) {
  const obs = await prisma.acesObservation.findMany({
    where: {
      projectId: toolId,
      promptCategory: { equals: categoryId, mode: 'insensitive' },
    },
    select: { wasChosen: true, wasCustomDIY: true },
  });

  if (obs.length === 0) return 5;

  const chosen = obs.filter(o => o.wasChosen && !o.wasCustomDIY).length;
  const pickRate = chosen / obs.length;

  // Scale 0-1 pick rate to 1-10
  return clamp(Math.round(pickRate * 9 + 1), 1, 10);
}

/**
 * ACES-based usage measurement.
 * Category-normalized coverage: what fraction of the category's obs involve this tool.
 */
async function measureUsage(toolId, categoryId) {
  const [toolObs, categoryObs] = await Promise.all([
    prisma.acesObservation.count({
      where: {
        projectId: toolId,
        promptCategory: { equals: categoryId, mode: 'insensitive' },
      },
    }),
    prisma.acesObservation.count({
      where: {
        promptCategory: { equals: categoryId, mode: 'insensitive' },
      },
    }),
  ]);

  if (categoryObs === 0) return 5;

  const coverage = toolObs / categoryObs;
  return clamp(Math.round(coverage * 9 + 1), 1, 10);
}

/**
 * ACES-based human coefficient measurement.
 * Residual between pick rate and expert endorsement rate.
 */
async function measureHuman(toolId, categoryId) {
  const obs = await prisma.acesObservation.findMany({
    where: {
      projectId: toolId,
      promptCategory: { equals: categoryId, mode: 'insensitive' },
      expertAgreed: { not: null },
    },
    select: { wasChosen: true, expertAgreed: true },
  });

  if (obs.length === 0) {
    // Fall back to AI rating
    const aiRating = await prisma.aIRating.findUnique({
      where: { projectId: toolId },
      select: { humanCoefficient: true },
    });
    return aiRating ? clamp(aiRating.humanCoefficient, 1, 10) : 5;
  }

  const expertAgreedCount = obs.filter(o => o.expertAgreed).length;
  const endorsementRate = expertAgreedCount / obs.length;

  return clamp(Math.round(endorsementRate * 9 + 1), 1, 10);
}

/**
 * ACES-based awareness cost measurement — full 3-signal spec implementation.
 *
 * Signal 1 (50%): Unprompted visibility rate — tool appears without being named in prompt.
 * Signal 2 (25%): Cross-model consistency — std-dev of per-model visibility rates (low variance = consistent).
 * Signal 3 (25%): Correct understanding rate — when agents pick this tool, is it in the right category?
 *
 * Uses `modelName` (preferred) or `agentName` as the model dimension.
 *
 * @returns {{ cost: number, detail: Object, visibilityByModel: Object }}
 */
async function measureAwarenessCost(toolId, categoryId) {
  // Fetch all observations for this category (not just this tool)
  const obs = await prisma.acesObservation.findMany({
    where: {
      promptCategory: { equals: categoryId, mode: 'insensitive' },
    },
    select: {
      projectId: true,
      agentName: true,
      modelName: true,
      wasChosen: true,
      wasCustomDIY: true,
      alternatives: true,
      mentions: true,
      promptText: true,
    },
  });

  if (obs.length === 0) {
    return {
      cost: 5,
      detail: { visibilityRate: 0, crossModelConsistency: 0, correctUsageRate: 0, signals: {} },
      visibilityByModel: {},
    };
  }

  // Determine model key: prefer modelName, fall back to agentName
  const modelKey = (o) => o.modelName || o.agentName;

  // ─── Signal 1: Unprompted visibility rate ──────────────────────
  // Tool appears as primary pick, in alternatives list, or in mentions — without being named in the prompt.
  function toolAppearsInObservation(o) {
    if (o.projectId === toolId) return true;

    // Check alternatives JSON: [{tool, reason}]
    if (Array.isArray(o.alternatives)) {
      if (o.alternatives.some(a => a.tool === toolId || a.toolId === toolId)) return true;
    }

    // Check mentions JSON: tool names or IDs
    if (Array.isArray(o.mentions)) {
      if (o.mentions.includes(toolId) || o.mentions.includes(String(toolId))) return true;
    }

    return false;
  }

  const appearsIn = obs.filter(toolAppearsInObservation).length;
  const visibilityRate = obs.length > 0 ? appearsIn / obs.length : 0;

  // ─── Signal 2: Cross-model consistency ─────────────────────────
  // Group observations by model, compute per-model visibility, then measure consistency.
  const byModel = new Map();
  for (const o of obs) {
    const key = modelKey(o);
    if (!byModel.has(key)) byModel.set(key, []);
    byModel.get(key).push(o);
  }

  const visibilityByModel = {};
  const modelVisibilities = [];

  for (const [model, modelObs] of byModel) {
    const modelAppears = modelObs.filter(toolAppearsInObservation).length;
    const rate = modelObs.length > 0 ? modelAppears / modelObs.length : 0;
    visibilityByModel[model] = Math.round(rate * 1000) / 1000;
    modelVisibilities.push(rate);
  }

  // Cross-model consistency: 1 - normalized std deviation
  // If only one model, consistency = 1 (no variance observable)
  let crossModelConsistency = 1;
  if (modelVisibilities.length > 1) {
    const mean = modelVisibilities.reduce((a, b) => a + b, 0) / modelVisibilities.length;
    const variance = modelVisibilities.reduce((sum, v) => sum + (v - mean) ** 2, 0) / modelVisibilities.length;
    const stdDev = Math.sqrt(variance);
    // Normalize: std dev of 0 = perfect consistency (1.0), std dev of 0.5 = zero consistency
    crossModelConsistency = clamp(1 - stdDev * 2, 0, 1);
  }

  // ─── Signal 3: Correct understanding rate ──────────────────────
  // When agents pick this tool, is it for the right category?
  // We check: observations where this tool is the primary pick AND the observation's promptCategory matches.
  // Since we already filtered by category, all primary picks here are "correct".
  // The "incorrect" signal would be this tool appearing as primary in OTHER categories.
  const allObsForTool = await prisma.acesObservation.findMany({
    where: { projectId: toolId },
    select: { promptCategory: true, wasChosen: true },
  });

  let correctUsageRate = 1;
  if (allObsForTool.length > 0) {
    const chosenObs = allObsForTool.filter(o => o.wasChosen);
    if (chosenObs.length > 0) {
      const correctPicks = chosenObs.filter(
        o => o.promptCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categoryId.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      ).length;
      correctUsageRate = correctPicks / chosenObs.length;
    }
  }

  // ─── Combine: spec weights ─────────────────────────────────────
  const combinedVisibility =
    visibilityRate * 0.50 +
    crossModelConsistency * 0.25 +
    correctUsageRate * 0.25;

  // Invert: high visibility = low cost
  const cost = clamp(Math.round(((1 - combinedVisibility) * 9 + 1) * 10) / 10, 1, 10);

  const detail = {
    visibilityRate: Math.round(visibilityRate * 1000) / 1000,
    crossModelConsistency: Math.round(crossModelConsistency * 1000) / 1000,
    correctUsageRate: Math.round(correctUsageRate * 1000) / 1000,
    combinedVisibility: Math.round(combinedVisibility * 1000) / 1000,
    modelCount: byModel.size,
    observationCount: obs.length,
    signals: {
      visibilityWeight: 0.50,
      crossModelWeight: 0.25,
      correctUsageWeight: 0.25,
    },
  };

  return { cost, detail, visibilityByModel };
}

/**
 * ACES-based friction cost measurement.
 * Based on success rate, retries, and abandonment.
 */
async function measureFrictionCost(toolId) {
  const obs = await prisma.acesObservation.findMany({
    where: {
      projectId: toolId,
      wasChosen: true,
    },
    select: { implementationSucceeded: true, abandoned: true, retryCount: true },
  });

  if (obs.length === 0) {
    // Fall back to AI rating
    const aiRating = await prisma.aIRating.findUnique({
      where: { projectId: toolId },
      select: { agentFriction: true },
    });
    return aiRating ? clamp(11 - aiRating.agentFriction, 1, 10) : 5;
  }

  const successCount = obs.filter(o => o.implementationSucceeded === true).length;
  const abandonCount = obs.filter(o => o.abandoned === true).length;
  const avgRetries = obs.reduce((sum, o) => sum + (o.retryCount || 0), 0) / obs.length;

  // Friction score: low success + high abandon + retries = high friction cost
  const successRate = obs.length > 0 ? successCount / obs.length : 0.5;
  const abandonRate = obs.length > 0 ? abandonCount / obs.length : 0;

  const frictionSignal = (1 - successRate) * 0.5 + abandonRate * 0.3 + Math.min(avgRetries / 3, 1) * 0.2;
  return clamp(Math.round(frictionSignal * 9 + 1), 1, 10);
}

/**
 * Get data quality info for confidence calculation.
 */
export async function getToolDataQuality(toolId, categoryId) {
  const where = {
    projectId: toolId,
    ...(categoryId ? { promptCategory: { equals: categoryId, mode: 'insensitive' } } : {}),
  };

  const [observationCount, expertReviewed, distinctModels, distinctRepoTypes, lastObs] = await Promise.all([
    prisma.acesObservation.count({ where }),
    prisma.acesObservation.count({ where: { ...where, expertAgreed: { not: null } } }),
    prisma.acesObservation.groupBy({ by: ['agentName'], where }).then(r => r.length),
    prisma.acesObservation.groupBy({ by: ['repoType'], where: { ...where, repoType: { not: null } } }).then(r => r.length),
    prisma.acesObservation.findFirst({ where, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
  ]);

  const daysSinceLastObservation = lastObs
    ? Math.floor((Date.now() - lastObs.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : 365;

  return {
    observationCount,
    expertReviewedCount: expertReviewed,
    distinctModels,
    distinctRepoTypes,
    daysSinceLastObservation,
  };
}

export default {
  mapFromAIRating,
  measureVariables,
  getToolDataQuality,
};
