import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ExportService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
  }

  async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  /**
   * Export all projects to JSONL
   */
  async exportProjects() {
    const projects = await prisma.project.findMany({
      orderBy: { id: 'asc' }
    });

    const jsonl = projects.map(project => {
      // Convert to plain object and format tags
      const data = {
        id: project.id,
        name: project.name,
        type: project.type,
        category: project.category,
        description: project.description,
        url: project.url,
        githubUrl: project.githubUrl,
        logo: project.logo,
        tags: project.tags,
        yearCreated: project.yearCreated,
        selfHostable: project.selfHostable,
        license: project.license,
        techStack: project.techStack,
        alternativeTo: project.alternativeTo,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      };
      return JSON.stringify(data);
    }).join('\n');

    await this.ensureDataDirectory();
    const filePath = path.join(this.dataDir, 'projects.jsonl');
    await fs.writeFile(filePath, jsonl + '\n', 'utf-8');

    return { count: projects.length, file: 'projects.jsonl' };
  }

  /**
   * Export all AI ratings to JSONL
   */
  async exportAIRatings() {
    const ratings = await prisma.aIRating.findMany({
      include: {
        project: {
          select: { name: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    const jsonl = ratings.map(rating => {
      const data = {
        id: rating.id,
        projectId: rating.projectId,
        projectName: rating.project.name,
        insightCompression: rating.insightCompression,
        substrateEfficiency: rating.substrateEfficiency,
        broadUtility: rating.broadUtility,
        awareness: rating.awareness,
        agentFriction: rating.agentFriction,
        humanCoefficient: rating.humanCoefficient,
        survivalScore: rating.survivalScore,
        tier: rating.tier,
        confidence: rating.confidence,
        reasoning: rating.reasoning,
        suggestions: rating.suggestions,
        model: rating.model,
        githubStars: rating.githubStars,
        githubForks: rating.githubForks,
        githubIssues: rating.githubIssues,
        npmDownloads: rating.npmDownloads,
        documentationQuality: rating.documentationQuality,
        lastAnalyzedAt: rating.lastAnalyzedAt.toISOString(),
        createdAt: rating.createdAt.toISOString()
      };
      return JSON.stringify(data);
    }).join('\n');

    await this.ensureDataDirectory();
    const filePath = path.join(this.dataDir, 'ai-ratings.jsonl');
    await fs.writeFile(filePath, jsonl + '\n', 'utf-8');

    return { count: ratings.length, file: 'ai-ratings.jsonl' };
  }

  /**
   * Export all community ratings to JSONL
   */
  async exportCommunityRatings() {
    const ratings = await prisma.userRating.findMany({
      include: {
        project: {
          select: { name: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    const jsonl = ratings.map(rating => {
      const data = {
        id: rating.id,
        projectId: rating.projectId,
        projectName: rating.project.name,
        insightCompression: rating.insightCompression,
        substrateEfficiency: rating.substrateEfficiency,
        broadUtility: rating.broadUtility,
        awareness: rating.awareness,
        agentFriction: rating.agentFriction,
        humanCoefficient: rating.humanCoefficient,
        userId: rating.userId,
        createdAt: rating.createdAt.toISOString()
      };
      return JSON.stringify(data);
    }).join('\n');

    await this.ensureDataDirectory();
    const filePath = path.join(this.dataDir, 'community-ratings.jsonl');
    await fs.writeFile(filePath, jsonl + '\n', 'utf-8');

    return { count: ratings.length, file: 'community-ratings.jsonl' };
  }

  /**
   * Export pending submissions to JSONL
   */
  async exportSubmissions() {
    const submissions = await prisma.projectSubmission.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });

    const jsonl = submissions.map(submission => {
      const data = {
        id: submission.id,
        name: submission.name,
        type: submission.type,
        category: submission.category,
        description: submission.description,
        url: submission.url,
        githubUrl: submission.githubUrl,
        logo: submission.logo,
        tags: submission.tags,
        yearCreated: submission.yearCreated,
        selfHostable: submission.selfHostable,
        license: submission.license,
        techStack: submission.techStack,
        alternativeTo: submission.alternativeTo,
        submittedBy: submission.submittedBy,
        submitterEmail: submission.submitterEmail,
        createdAt: submission.createdAt.toISOString()
      };
      return JSON.stringify(data);
    }).join('\n');

    await this.ensureDataDirectory();
    const filePath = path.join(this.dataDir, 'submissions.jsonl');
    await fs.writeFile(filePath, jsonl + '\n', 'utf-8');

    return { count: submissions.length, file: 'submissions.jsonl' };
  }

  /**
   * Export all data files
   */
  async exportAll() {
    const results = await Promise.all([
      this.exportProjects(),
      this.exportAIRatings(),
      this.exportCommunityRatings(),
      this.exportSubmissions()
    ]);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      exports: results
    };
  }

  /**
   * Get export statistics
   */
  async getStats() {
    const [projectCount, aiRatingCount, communityRatingCount, submissionCount] = await Promise.all([
      prisma.project.count(),
      prisma.aIRating.count(),
      prisma.userRating.count(),
      prisma.projectSubmission.count({ where: { status: 'pending' } })
    ]);

    return {
      projects: projectCount,
      aiRatings: aiRatingCount,
      communityRatings: communityRatingCount,
      pendingSubmissions: submissionCount
    };
  }
}

export default new ExportService();
