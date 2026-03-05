import prisma from '../config/database.js';
import {
  AWARENESS_THRESHOLD,
  PROMPT_WEIGHTS,
  GEM_OFFSET,
  MIN_SAMPLE_SIZE,
  classifyHiddenGem,
} from './aasConstants.js';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Calculate per-model awareness from execution/extraction data.
 * @param {Object} data - { needPicks, needTotal, ecoPicks, ecoTotal, considAppearances, considTotal }
 * @returns {{ pickRate: number, knowsTool: boolean }}
 */
export function calculateModelAwareness(data) {
  const needRate = data.needTotal > 0 ? data.needPicks / data.needTotal : 0;
  const ecoRate = data.ecoTotal > 0 ? data.ecoPicks / data.ecoTotal : 0;
  const considRate = data.considTotal > 0 ? data.considAppearances / data.considTotal : 0;

  const pickRate =
    needRate * PROMPT_WEIGHTS.need_based +
    ecoRate * PROMPT_WEIGHTS.ecosystem_adjacent +
    considRate * PROMPT_WEIGHTS.consideration;

  return {
    pickRate,
    knowsTool: pickRate >= AWARENESS_THRESHOLD,
    needRate,
    ecoRate,
    considRate,
  };
}

/**
 * Calculate composite AAS from per-model scores using geometric mean.
 * @param {Array<{pickRate: number, needTotal: number}>} modelScores
 * @returns {number} AAS 0-100
 */
export function calculateAAS(modelScores) {
  const validModels = modelScores.filter(m => m.needTotal >= MIN_SAMPLE_SIZE);
  if (validModels.length === 0) return 0;

  const product = validModels.reduce((acc, m) => acc * (m.pickRate + GEM_OFFSET), 1);
  const geometricMean = Math.pow(product, 1 / validModels.length);

  return Math.round(geometricMean * 100);
}

/**
 * Count distinct repository types where the tool was picked.
 */
export async function calculateContextBreadth(toolId, categoryId) {
  const executions = await prisma.agentExecution.findMany({
    where: { categoryId },
    include: {
      extraction: {
        where: { primaryToolId: toolId },
      },
    },
  });

  const repoTypes = new Set();
  for (const exec of executions) {
    if (exec.extraction) {
      repoTypes.add(exec.repositoryType);
    }
  }

  return repoTypes.size; // 0-4
}

/**
 * Calculate fraction of models that "know" the tool.
 */
export function calculateCrossModelConsistency(modelScores) {
  if (modelScores.length === 0) return 0;
  const knowingModels = modelScores.filter(m => m.knowsTool).length;
  return knowingModels / modelScores.length;
}

/**
 * Compute full AAS for a single tool in a category from real execution data.
 */
export async function computeToolAAS(toolId, categoryId) {
  // Get all executions for this category
  const executions = await prisma.agentExecution.findMany({
    where: { categoryId },
    include: { extraction: true },
  });

  // Group by agent+model
  const modelGroups = {};
  for (const exec of executions) {
    const key = `${exec.agentName}:${exec.modelName}`;
    if (!modelGroups[key]) {
      modelGroups[key] = {
        modelId: key,
        agentName: exec.agentName,
        modelName: exec.modelName,
        needPicks: 0, needTotal: 0,
        ecoPicks: 0, ecoTotal: 0,
        considAppearances: 0, considTotal: 0,
      };
    }
    const g = modelGroups[key];
    const isPick = exec.extraction?.primaryToolId === toolId;

    if (exec.promptType === 'need_based') {
      g.needTotal++;
      if (isPick) g.needPicks++;
    } else if (exec.promptType === 'ecosystem_adjacent') {
      g.ecoTotal++;
      if (isPick) g.ecoPicks++;
    } else if (exec.promptType === 'consideration') {
      g.considTotal++;
      // Check consideration set for this tool
      const considSet = exec.extraction?.considerationSet;
      if (isPick || (Array.isArray(considSet) && considSet.some(c => c.tool_id === toolId || c.toolId === toolId))) {
        g.considAppearances++;
      }
    }
  }

  const modelScores = Object.values(modelGroups).map(g => ({
    ...calculateModelAwareness(g),
    modelId: g.modelId,
    agentName: g.agentName,
    modelName: g.modelName,
    needTotal: g.needTotal,
  }));

  const aas = calculateAAS(modelScores);
  const contextBreadth = await calculateContextBreadth(toolId, categoryId);
  const crossModelConsistency = calculateCrossModelConsistency(modelScores);

  // Calculate sub-signal averages
  const validModels = modelScores.filter(m => m.needTotal >= MIN_SAMPLE_SIZE);
  const avgNeedRate = validModels.length > 0
    ? validModels.reduce((s, m) => s + m.needRate, 0) / validModels.length
    : 0;
  const avgEcoRate = validModels.length > 0
    ? validModels.reduce((s, m) => s + m.ecoRate, 0) / validModels.length
    : 0;
  const avgConsidRate = validModels.length > 0
    ? validModels.reduce((s, m) => s + m.considRate, 0) / validModels.length
    : 0;

  // Expert preference
  const expertEvals = await prisma.expertEvaluation.findMany({
    where: { toolId, categoryId },
  });
  let expertPreference = null;
  let hiddenGemGap = null;
  let hiddenGemClass = null;

  if (expertEvals.length > 0) {
    const yesCount = expertEvals.filter(e => e.wouldYouUse === 'yes').length;
    expertPreference = (yesCount / expertEvals.length) * 100;
    hiddenGemGap = expertPreference - aas;
    hiddenGemClass = classifyHiddenGem(aas, expertPreference);
  }

  const totalDataPoints = executions.filter(e => e.extraction).length;

  return {
    aas,
    unpromptedPickRate: avgNeedRate,
    ecosystemPickRate: avgEcoRate,
    considerationRate: avgConsidRate,
    contextBreadth,
    crossModelConsistency,
    expertPreference,
    hiddenGemGap,
    hiddenGemClass,
    modelScores: modelScores.map(m => ({
      modelId: m.modelId,
      agentName: m.agentName,
      modelName: m.modelName,
      pickRate: m.pickRate,
      knowsTool: m.knowsTool,
    })),
    dataPoints: totalDataPoints,
    confidence: totalDataPoints >= 50 ? 0.8 : totalDataPoints >= 20 ? 0.5 : 0.2,
  };
}

/**
 * Compute AAS for all projects and store as AasScore records.
 */
export async function computeAllAAS() {
  const projects = await prisma.project.findMany({ select: { id: true, category: true } });
  const results = [];

  for (const project of projects) {
    // Normalize category
    const categoryId = project.category?.toLowerCase().replace(/\s+/g, '-') || 'unknown';

    try {
      const aasData = await computeToolAAS(project.id, categoryId);

      const record = await prisma.aasScore.create({
        data: {
          toolId: project.id,
          categoryId,
          aas: aasData.aas,
          unpromptedPickRate: aasData.unpromptedPickRate,
          ecosystemPickRate: aasData.ecosystemPickRate,
          considerationRate: aasData.considerationRate,
          contextBreadth: aasData.contextBreadth,
          crossModelConsistency: aasData.crossModelConsistency,
          expertPreference: aasData.expertPreference,
          hiddenGemGap: aasData.hiddenGemGap,
          hiddenGemClass: aasData.hiddenGemClass,
          modelScores: aasData.modelScores,
          dataPoints: aasData.dataPoints,
          confidence: aasData.confidence,
        },
      });

      results.push(record);
    } catch (err) {
      console.error(`Failed to compute AAS for project ${project.id}:`, err.message);
    }
  }

  return results;
}
