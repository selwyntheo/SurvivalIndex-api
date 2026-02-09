import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Submit a new project for review
 * POST /api/submissions
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      category,
      description,
      url,
      githubUrl,
      logo,
      tags,
      yearCreated,
      selfHostable,
      license,
      techStack,
      alternativeTo,
      submittedBy,
      submitterEmail
    } = req.body;

    // Validate required fields
    if (!name || !type || !category || !description) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, category, description'
      });
    }

    // Check if project with same name already exists
    const existingProject = await prisma.project.findUnique({
      where: { name }
    });

    if (existingProject) {
      return res.status(400).json({
        error: 'A project with this name already exists'
      });
    }

    // Check if there's already a pending submission with this name
    const existingSubmission = await prisma.projectSubmission.findFirst({
      where: {
        name,
        status: 'pending'
      }
    });

    if (existingSubmission) {
      return res.status(400).json({
        error: 'A submission with this name is already pending review'
      });
    }

    // Create submission
    const submission = await prisma.projectSubmission.create({
      data: {
        name,
        type,
        category,
        description,
        url,
        githubUrl,
        logo: logo || '📦',
        tags,
        yearCreated: yearCreated ? parseInt(yearCreated) : null,
        selfHostable: selfHostable || false,
        license,
        techStack,
        alternativeTo,
        submittedBy,
        submitterEmail,
        status: 'pending'
      }
    });

    res.status(201).json({
      message: 'Project submitted successfully! It will be reviewed by an admin.',
      submission: {
        id: submission.id,
        name: submission.name,
        status: submission.status,
        createdAt: submission.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to submit project' });
  }
});

/**
 * Get all submissions (admin only)
 * GET /api/submissions
 */
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const where = status ? { status } : {};
    
    const [submissions, total] = await Promise.all([
      prisma.projectSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.projectSubmission.count({ where })
    ]);

    res.json({
      data: submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * Get pending submissions count (admin only)
 * GET /api/submissions/pending/count
 */
router.get('/pending/count', requireAuth, requireAdmin, async (req, res) => {
  try {
    const count = await prisma.projectSubmission.count({
      where: { status: 'pending' }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error counting pending submissions:', error);
    res.status(500).json({ error: 'Failed to count pending submissions' });
  }
});

/**
 * Get a single submission (admin only)
 * GET /api/submissions/:id
 */
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await prisma.projectSubmission.findUnique({
      where: { id: parseInt(id) }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

/**
 * Approve a submission and create project (admin only)
 * POST /api/submissions/:id/approve
 */
router.post('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNotes, triggerAIEvaluation } = req.body;

    const submission = await prisma.projectSubmission.findUnique({
      where: { id: parseInt(id) }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ error: 'Submission has already been reviewed' });
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
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
        alternativeTo: submission.alternativeTo
      }
    });

    // Update submission status
    const updatedSubmission = await prisma.projectSubmission.update({
      where: { id: parseInt(id) },
      data: {
        status: 'approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        reviewNotes,
        projectId: project.id
      }
    });

    res.json({
      message: 'Submission approved and project created',
      submission: updatedSubmission,
      project,
      triggerAIEvaluation: triggerAIEvaluation || false
    });
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
});

/**
 * Reject a submission (admin only)
 * POST /api/submissions/:id/reject
 */
router.post('/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, reviewNotes } = req.body;

    const submission = await prisma.projectSubmission.findUnique({
      where: { id: parseInt(id) }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ error: 'Submission has already been reviewed' });
    }

    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Update submission status
    const updatedSubmission = await prisma.projectSubmission.update({
      where: { id: parseInt(id) },
      data: {
        status: 'rejected',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        rejectionReason,
        reviewNotes
      }
    });

    res.json({
      message: 'Submission rejected',
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ error: 'Failed to reject submission' });
  }
});

/**
 * Delete a submission (admin only)
 * DELETE /api/submissions/:id
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.projectSubmission.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

export default router;
