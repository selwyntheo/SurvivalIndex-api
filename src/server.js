import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projects.js';
import ratingRoutes from './routes/ratings.js';
import aiJudgeRoutes from './routes/ai-judge.js';
import authRoutes from './routes/auth.js';
import submissionRoutes from './routes/submissions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'SurvivalIndex API',
    version: '1.0.0',
    description: 'AI-powered software survival rating platform',
    mode: process.env.ANTHROPIC_API_KEY === 'demo_mode' ? 'DEMO MODE' : 'PRODUCTION',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        login: 'POST /api/auth/login (body: {email, password})',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        register: 'POST /api/auth/register (body: {email, password, role?, name?})'
      },
      projects: {
        list: 'GET /api/projects',
        getById: 'GET /api/projects/:id',
        leaderboard: 'GET /api/projects/leaderboard',
        create: 'POST /api/projects',
        update: 'PUT /api/projects/:id',
        delete: 'DELETE /api/projects/:id'
      },
      aiJudge: {
        evaluate: 'POST /api/ai-judge/evaluate/:projectId [ADMIN ONLY]',
        batchEvaluate: 'POST /api/ai-judge/batch-evaluate (body: {projectIds: [1,2,3]}) [ADMIN ONLY]',
        reevaluateStale: 'POST /api/ai-judge/reevaluate-stale?daysOld=30 [ADMIN ONLY]'
      },
      ratings: {
        submit: 'POST /api/ratings',
        getByProject: 'GET /api/ratings/:projectId',
        getAverage: 'GET /api/ratings/:projectId/average'
      },
      submissions: {
        submit: 'POST /api/submissions (body: project details)',
        list: 'GET /api/submissions [ADMIN ONLY]',
        get: 'GET /api/submissions/:id [ADMIN ONLY]',
        pendingCount: 'GET /api/submissions/pending/count [ADMIN ONLY]',
        approve: 'POST /api/submissions/:id/approve [ADMIN ONLY]',
        reject: 'POST /api/submissions/:id/reject (body: {rejectionReason}) [ADMIN ONLY]',
        delete: 'DELETE /api/submissions/:id [ADMIN ONLY]'
      }
    },
    examples: {
      evaluateProject: 'curl -X POST http://localhost:3001/api/ai-judge/evaluate/1',
      getLeaderboard: 'curl http://localhost:3001/api/projects/leaderboard',
      listProjects: 'curl http://localhost:3001/api/projects'
    },
    docs: 'See README.md and SETUP_GUIDE.md for full documentation'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/ai-judge', aiJudgeRoutes);
app.use('/api/submissions', submissionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SurvivalIndex API server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
