import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import projectRoutes from './routes/projects.js';
import ratingRoutes from './routes/ratings.js';
import aiJudgeRoutes from './routes/ai-judge.js';
import authRoutes from './routes/auth.js';
import submissionRoutes from './routes/submissions.js';
import exportRoutes from './routes/export.js';
import acesRoutes from './routes/aces.js';
import sfiRoutes from './routes/sfi.js';
import aasRoutes from './routes/aas.js';
import authService from './services/authService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.FRONTEND_URL) {
  console.error('FATAL: FRONTEND_URL must be set in production');
  process.exit(1);
}

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body size limit
app.use(express.json({ limit: '100kb' }));

// Rate limiting
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const aiJudgeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai-judge', aiJudgeLimiter);
app.use('/api/submissions', writeLimiter);
app.use('/api/ratings', writeLimiter);
app.use('/api/aces/observations', writeLimiter);
app.use('/api/aas/executions', writeLimiter);
app.use('/api/aas/expert-evaluations', writeLimiter);
app.use('/api', generalLimiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SurvivalIndex API',
    version: '1.0.0',
    health: 'GET /api/health',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/ai-judge', aiJudgeRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/aces', acesRoutes);
app.use('/api/sfi', sfiRoutes);
app.use('/api/aas', aasRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
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
  console.log(`SurvivalIndex API running on port ${PORT}`);

  // Cleanup expired sessions hourly
  setInterval(() => {
    authService.cleanupExpiredSessions().catch(err =>
      console.error('Session cleanup error:', err)
    );
  }, 60 * 60 * 1000);
});
