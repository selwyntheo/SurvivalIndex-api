import prisma from '../config/database.js';

/**
 * Service for managing projects
 */
class ProjectService {
  /**
   * Get all projects with optional filters and pagination
   */
  async getAllProjects(filters = {}) {
    const { type, category, minScore, maxScore, page = 1, limit = 20 } = filters;

    const where = {};

    if (type) where.type = type;
    if (category) where.category = category;
    if (minScore || maxScore) {
      where.aiRating = {
        survivalScore: {
          ...(minScore && { gte: parseFloat(minScore) }),
          ...(maxScore && { lte: parseFloat(maxScore) })
        }
      };
    }

    // Calculate pagination with bounds
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination metadata
    const total = await prisma.project.count({ where });

    // Get paginated projects
    const projects = await prisma.project.findMany({
      where,
      include: {
        aiRating: true,
        userRatings: true,
        aasScores: { orderBy: { computedAt: 'desc' }, take: 1 },
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limitNum
    });

    return {
      data: projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    };
  }

  /**
   * Get single project by ID
   */
  async getProjectById(id) {
    return await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        aiRating: true,
        userRatings: true
      }
    });
  }

  /**
   * Whitelist allowed project fields
   */
  _pickProjectFields(data) {
    const allowed = ['name', 'type', 'category', 'description', 'url', 'githubUrl', 'logo', 'tags', 'yearCreated', 'selfHostable', 'license', 'techStack', 'alternativeTo'];
    const result = {};
    for (const key of allowed) {
      if (data[key] !== undefined) result[key] = data[key];
    }
    return result;
  }

  /**
   * Create new project
   */
  async createProject(projectData) {
    return await prisma.project.create({
      data: this._pickProjectFields(projectData),
      include: {
        aiRating: true
      }
    });
  }

  /**
   * Update project
   */
  async updateProject(id, projectData) {
    return await prisma.project.update({
      where: { id: parseInt(id) },
      data: this._pickProjectFields(projectData),
      include: {
        aiRating: true,
        userRatings: true
      }
    });
  }

  /**
   * Delete project
   */
  async deleteProject(id) {
    return await prisma.project.delete({
      where: { id: parseInt(id) }
    });
  }

  /**
   * Get leaderboard (projects sorted by survival score)
   */
  async getLeaderboard(limit = 100) {
    const projects = await prisma.project.findMany({
      where: {
        aiRating: {
          isNot: null
        }
      },
      include: {
        aiRating: true
      },
      take: limit
    });

    // Sort by survival score (can't do in Prisma easily with relations)
    return projects.sort((a, b) =>
      (b.aiRating?.survivalScore || 0) - (a.aiRating?.survivalScore || 0)
    );
  }
}

export default new ProjectService();
