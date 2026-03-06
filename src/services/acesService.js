import prisma from '../config/database.js';

/**
 * ACES (Agent Choice Evaluation System) Service
 * Manages agent choice observations and computes ACES metrics for projects.
 */
class AcesService {
  /**
   * Record a new agent choice observation
   */
  async recordObservation(data) {
    const {
      projectId,
      agentName,
      promptCategory,
      promptText,
      wasChosen,
      alternativeChosen,
      wasCustomDIY,
      sessionId,
      source
    } = data;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    return await prisma.acesObservation.create({
      data: {
        projectId: parseInt(projectId),
        agentName,
        promptCategory,
        promptText: promptText || null,
        wasChosen: Boolean(wasChosen),
        alternativeChosen: alternativeChosen || null,
        wasCustomDIY: Boolean(wasCustomDIY),
        sessionId: sessionId || null,
        source: source || null
      }
    });
  }

  /**
   * Record an expert review on an observation
   */
  async recordExpertReview(observationId, { expertAgreed, expertReviewedBy }) {
    return await prisma.acesObservation.update({
      where: { id: parseInt(observationId) },
      data: {
        expertAgreed: Boolean(expertAgreed),
        expertReviewedBy,
        expertReviewedAt: new Date()
      }
    });
  }

  /**
   * Get ACES metrics for a project
   */
  async getMetrics(projectId) {
    return await prisma.acesMetric.findUnique({
      where: { projectId: parseInt(projectId) }
    });
  }

  /**
   * Get all ACES metrics
   */
  async getAllMetrics() {
    return await prisma.acesMetric.findMany({
      include: {
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { agentPickRate: 'desc' }
    });
  }

  /**
   * Aggregate observations into ACES metrics for a single project
   */
  async aggregateMetrics(projectId) {
    const pid = parseInt(projectId);

    const observations = await prisma.acesObservation.findMany({
      where: { projectId: pid }
    });

    if (observations.length === 0) {
      return null;
    }

    // Agent pick rate: fraction of observations where the project was chosen
    const agentPickRate = observations.filter(o => o.wasChosen).length / observations.length;

    // Custom/DIY rate: fraction where agent built custom instead
    const customDIYRate = observations.filter(o => o.wasCustomDIY).length / observations.length;

    // Expert agreement rate: among expert-reviewed observations, how often did expert agree
    const expertReviewed = observations.filter(o => o.expertAgreed !== null);
    const expertAgreementRate = expertReviewed.length > 0
      ? expertReviewed.filter(o => o.expertAgreed).length / expertReviewed.length
      : 0.5; // Default to neutral if no expert reviews

    // Phrasing stability: consistency of pick rate across different prompt categories
    const categoryMap = {};
    for (const obs of observations) {
      if (!categoryMap[obs.promptCategory]) {
        categoryMap[obs.promptCategory] = { chosen: 0, total: 0 };
      }
      categoryMap[obs.promptCategory].total++;
      if (obs.wasChosen) categoryMap[obs.promptCategory].chosen++;
    }

    const categories = Object.values(categoryMap);
    let phrasingStability = 1.0;
    if (categories.length > 1) {
      const rates = categories.map(c => c.chosen / c.total);
      const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
      const variance = rates.reduce((sum, r) => sum + (r - mean) ** 2, 0) / rates.length;
      // Convert variance to a 0-1 stability score (lower variance = higher stability)
      phrasingStability = Math.max(0, 1 - Math.sqrt(variance) * 2);
    }

    // Survival alignment: correlation between being chosen and project having high survival score
    // For now, use pick rate as a proxy (projects with higher pick rate align with survival)
    const survivalAlignment = agentPickRate;

    const metric = await prisma.acesMetric.upsert({
      where: { projectId: pid },
      create: {
        projectId: pid,
        agentPickRate,
        survivalAlignment,
        customDIYRate,
        expertAgreementRate,
        phrasingStability,
        totalObservations: observations.length,
        lastAggregatedAt: new Date()
      },
      update: {
        agentPickRate,
        survivalAlignment,
        customDIYRate,
        expertAgreementRate,
        phrasingStability,
        totalObservations: observations.length,
        lastAggregatedAt: new Date()
      }
    });

    return metric;
  }

  /**
   * Aggregate metrics for all projects that have observations
   */
  async aggregateAllMetrics() {
    const projectIds = await prisma.acesObservation.findMany({
      select: { projectId: true },
      distinct: ['projectId']
    });

    const results = [];
    for (const { projectId } of projectIds) {
      const metric = await this.aggregateMetrics(projectId);
      if (metric) results.push(metric);
    }

    return results;
  }

  /**
   * Calculate a 0-10 ACES score from the 5 sub-metrics
   */
  calculateAcesScore(metric) {
    if (!metric) return null;

    const score = (
      metric.agentPickRate * 0.30 +
      metric.survivalAlignment * 0.20 +
      (1 - metric.customDIYRate) * 0.20 +
      metric.expertAgreementRate * 0.15 +
      metric.phrasingStability * 0.15
    ) * 10;

    return parseFloat(Math.min(10, Math.max(0, score)).toFixed(1));
  }
}

export default new AcesService();
