import prisma from '../config/database.js';
import { AAS_CATEGORIES, classifyHiddenGem } from './aasConstants.js';

/**
 * Build category leaderboard: categories ranked by avg AAS.
 */
export async function buildCategoryLeaderboard() {
  const scores = await prisma.aasScore.findMany({
    orderBy: { computedAt: 'desc' },
    include: { tool: { select: { id: true, name: true, logo: true } } },
  });

  // Deduplicate: keep only latest score per tool+category
  const latestScores = {};
  for (const s of scores) {
    const key = `${s.toolId}:${s.categoryId}`;
    if (!latestScores[key]) latestScores[key] = s;
  }

  // Group by category
  const byCategory = {};
  for (const s of Object.values(latestScores)) {
    if (!byCategory[s.categoryId]) byCategory[s.categoryId] = [];
    byCategory[s.categoryId].push(s);
  }

  const categories = Object.entries(byCategory).map(([categoryId, tools]) => {
    const avgAas = tools.reduce((sum, t) => sum + t.aas, 0) / tools.length;
    const sorted = [...tools].sort((a, b) => b.aas - a.aas);
    const topTool = sorted[0];
    const hiddenGems = tools.filter(t =>
      t.hiddenGemClass === 'strong_hidden_gem' || t.hiddenGemClass === 'mild_hidden_gem'
    ).length;

    const catMeta = AAS_CATEGORIES.find(c => c.id === categoryId);

    return {
      categoryId,
      name: catMeta?.name || categoryId,
      description: catMeta?.description || '',
      avgAas: Math.round(avgAas * 10) / 10,
      toolCount: tools.length,
      topTool: topTool ? { name: topTool.tool.name, aas: topTool.aas, logo: topTool.tool.logo } : null,
      hiddenGemCount: hiddenGems,
    };
  });

  return categories.sort((a, b) => b.avgAas - a.avgAas);
}

/**
 * Build tool leaderboard for a specific category.
 */
export async function buildToolLeaderboard(categoryId) {
  const scores = await prisma.aasScore.findMany({
    where: { categoryId },
    orderBy: { computedAt: 'desc' },
    include: { tool: { select: { id: true, name: true, logo: true, category: true } } },
  });

  // Deduplicate: keep only latest score per tool
  const latestByTool = {};
  for (const s of scores) {
    if (!latestByTool[s.toolId]) latestByTool[s.toolId] = s;
  }

  const tools = Object.values(latestByTool)
    .sort((a, b) => b.aas - a.aas)
    .map((s, i) => ({
      rank: i + 1,
      toolId: s.toolId,
      toolName: s.tool.name,
      logo: s.tool.logo,
      aas: s.aas,
      unpromptedPickRate: s.unpromptedPickRate,
      ecosystemPickRate: s.ecosystemPickRate,
      considerationRate: s.considerationRate,
      contextBreadth: s.contextBreadth,
      crossModelConsistency: s.crossModelConsistency,
      expertPreference: s.expertPreference,
      hiddenGemGap: s.hiddenGemGap,
      hiddenGemClass: s.hiddenGemClass,
      confidence: s.confidence,
      dataPoints: s.dataPoints,
      modelScores: s.modelScores || [],
    }));

  return tools;
}

/**
 * Get full AAS detail for a single tool.
 */
export async function getToolDetail(toolName, categoryId) {
  const tool = await prisma.project.findFirst({
    where: { name: { equals: toolName, mode: 'insensitive' } },
    select: { id: true, name: true, logo: true, category: true, description: true },
  });

  if (!tool) return null;

  const whereClause = { toolId: tool.id };
  if (categoryId) whereClause.categoryId = categoryId;

  const scores = await prisma.aasScore.findMany({
    where: whereClause,
    orderBy: { computedAt: 'desc' },
    take: 1,
  });

  if (scores.length === 0) return null;

  const score = scores[0];

  return {
    toolName: tool.name,
    toolId: tool.id,
    logo: tool.logo,
    category: score.categoryId,
    description: tool.description,
    aas: score.aas,
    unpromptedPickRate: score.unpromptedPickRate,
    ecosystemPickRate: score.ecosystemPickRate,
    considerationRate: score.considerationRate,
    contextBreadth: score.contextBreadth,
    crossModelConsistency: score.crossModelConsistency,
    expertPreference: score.expertPreference,
    hiddenGemGap: score.hiddenGemGap,
    hiddenGemClass: score.hiddenGemClass,
    modelScores: score.modelScores || [],
    dataPoints: score.dataPoints,
    confidence: score.confidence,
    computedAt: score.computedAt,
  };
}

/**
 * Get hidden gems across all categories or a specific one.
 */
export async function getHiddenGems(categoryId) {
  const where = {
    hiddenGemClass: { in: ['strong_hidden_gem', 'mild_hidden_gem'] },
  };
  if (categoryId) where.categoryId = categoryId;

  const scores = await prisma.aasScore.findMany({
    where,
    orderBy: [{ hiddenGemGap: 'desc' }, { computedAt: 'desc' }],
    include: { tool: { select: { id: true, name: true, logo: true, category: true } } },
  });

  // Deduplicate by tool+category, keep latest
  const seen = new Set();
  const gems = [];
  for (const s of scores) {
    const key = `${s.toolId}:${s.categoryId}`;
    if (!seen.has(key)) {
      seen.add(key);
      gems.push({
        toolId: s.toolId,
        toolName: s.tool.name,
        logo: s.tool.logo,
        categoryId: s.categoryId,
        aas: s.aas,
        expertPreference: s.expertPreference,
        hiddenGemGap: s.hiddenGemGap,
        hiddenGemClass: s.hiddenGemClass,
      });
    }
  }

  return gems;
}

/**
 * Get all categories with tool counts.
 */
export async function getCategories() {
  const scores = await prisma.aasScore.findMany({
    orderBy: { computedAt: 'desc' },
  });

  // Deduplicate: latest per tool+category
  const latestScores = {};
  for (const s of scores) {
    const key = `${s.toolId}:${s.categoryId}`;
    if (!latestScores[key]) latestScores[key] = s;
  }

  // Group by category
  const byCategory = {};
  for (const s of Object.values(latestScores)) {
    if (!byCategory[s.categoryId]) byCategory[s.categoryId] = [];
    byCategory[s.categoryId].push(s);
  }

  return AAS_CATEGORIES.map(cat => {
    const tools = byCategory[cat.id] || [];
    return {
      ...cat,
      toolCount: tools.length,
    };
  }).filter(cat => cat.toolCount > 0);
}
