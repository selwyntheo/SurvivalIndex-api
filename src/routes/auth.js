import express from 'express';
import authService from '../services/authService.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.login(email, password);

    res.json({
      success: true,
      user: result.user,
      token: result.token,
      expiresAt: result.expiresAt
    });
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout (delete session)
 */
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    await authService.logout(token);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user from session token
 */
router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await authService.validateSession(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register (Admin only - for creating new users)
 * Note: This should be protected in production
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, role, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await authService.createUser({
      email,
      password,
      role: role || 'user',
      name
    });

    res.status(201).json({
      success: true,
      user
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(error);
  }
});

export default router;
