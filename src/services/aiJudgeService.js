import prisma from '../config/database.js';
import aiJudge from '../agents/judge.js';

/**
 * Service for AI Judge operations
 */
class AIJudgeService {
  /**
   * Evaluate a project and store the AI rating
   */
  async evaluateAndStoreProject(projectId) {
    // Fetch project data
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    console.log(`📊 Starting AI evaluation for: ${project.name}`);

    // Get AI evaluation
    const evaluation = await aiJudge.evaluateProject(project);

    // Store or update AI rating
    const aiRating = await prisma.aIRating.upsert({
      where: { projectId },
      create: {
        projectId,
        insightCompression: evaluation.scores.insightCompression,
        substrateEfficiency: evaluation.scores.substrateEfficiency,
        broadUtility: evaluation.scores.broadUtility,
        awareness: evaluation.scores.awareness,
        agentFriction: evaluation.scores.agentFriction,
        humanCoefficient: evaluation.scores.humanCoefficient,
        survivalScore: evaluation.survivalScore,
        tier: evaluation.tier,
        confidence: evaluation.confidence,
        reasoning: evaluation.reasoning,
        suggestions: evaluation.suggestions || null,
        model: evaluation.model,
        githubStars: evaluation.githubData?.stars,
        githubForks: evaluation.githubData?.forks,
        githubIssues: evaluation.githubData?.openIssues,
        lastAnalyzedAt: new Date()
      },
      update: {
        insightCompression: evaluation.scores.insightCompression,
        substrateEfficiency: evaluation.scores.substrateEfficiency,
        broadUtility: evaluation.scores.broadUtility,
        awareness: evaluation.scores.awareness,
        agentFriction: evaluation.scores.agentFriction,
        humanCoefficient: evaluation.scores.humanCoefficient,
        survivalScore: evaluation.survivalScore,
        tier: evaluation.tier,
        confidence: evaluation.confidence,
        reasoning: evaluation.reasoning,
        suggestions: evaluation.suggestions || null,
        model: evaluation.model,
        githubStars: evaluation.githubData?.stars,
        githubForks: evaluation.githubData?.forks,
        githubIssues: evaluation.githubData?.openIssues,
        lastAnalyzedAt: new Date()
      }
    });

    console.log(`✅ AI evaluation complete: ${project.name} scored ${evaluation.survivalScore} (Tier ${evaluation.tier})`);

    return {
      project,
      aiRating,
      evaluation
    };
  }

  /**
   * Batch evaluate multiple projects
   */
  async batchEvaluate(projectIds) {
    const results = [];
    const errors = [];

    for (const projectId of projectIds) {
      try {
        const result = await this.evaluateAndStoreProject(projectId);
        results.push(result);
      } catch (error) {
        console.error(`Failed to evaluate project ${projectId}:`, error);
        errors.push({
          projectId,
          error: error.message
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      stats: {
        total: projectIds.length,
        successful: results.length,
        failed: errors.length
      }
    };
  }

  /**
   * Re-evaluate projects that haven't been analyzed recently
   */
  async reevaluateStaleProjects(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Find projects with stale ratings or no ratings
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { aiRating: null },
          {
            aiRating: {
              lastAnalyzedAt: {
                lt: cutoffDate
              }
            }
          }
        ]
      }
    });

    console.log(`🔄 Found ${projects.length} projects to re-evaluate`);

    const projectIds = projects.map(p => p.id);
    return await this.batchEvaluate(projectIds);
  }
}

export default new AIJudgeService();
