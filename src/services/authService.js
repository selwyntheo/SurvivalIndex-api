import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/database.js';

/**
 * Service for authentication and session management
 */
class AuthService {
  /**
   * Hash a password
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate a secure random token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new user (admin or regular)
   */
  async createUser({ email, password, role = 'user', name }) {
    const passwordHash = await this.hashPassword(password);

    return await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        name
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        createdAt: true
      }
    });
  }

  /**
   * Login user with email and password
   */
  async login(email, password) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate session token
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      token: session.token,
      expiresAt: session.expiresAt
    };
  }

  /**
   * Validate session token and return user
   */
  async validateSession(token) {
    if (!token) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            name: true
          }
        }
      }
    });

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      // Delete expired session
      await prisma.session.delete({
        where: { id: session.id }
      });
      return null;
    }

    return session.user;
  }

  /**
   * Logout user by deleting session
   */
  async logout(token) {
    if (!token) {
      return;
    }

    await prisma.session.deleteMany({
      where: { token }
    });
  }

  /**
   * Delete all sessions for a user
   */
  async logoutAll(userId) {
    await prisma.session.deleteMany({
      where: { userId }
    });
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return result.count;
  }
}

export default new AuthService();
