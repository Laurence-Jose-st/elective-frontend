import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { generateToken } from '../middleware/auth.js';

export const authController = {
  /**
   * Register a new user
   * Default role transitions from guest to 'registered'
   */
  async signup(req, res) {
    try {
      const { username, email, password, profile } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          error: 'Username, email, and password are required fields.',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long.',
          code: 'PASSWORD_TOO_SHORT',
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Please provide a valid email address.',
          code: 'INVALID_EMAIL_FORMAT',
        });
        return;
      }

      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'An account with this email address already exists. Please log in.',
          code: 'USER_ALREADY_EXISTS',
        });
        return;
      }

      // Hash password using bcrypt with salt factor 10
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Default role upon signup is 'REGISTERED' (matching schema)
      const role = 'REGISTERED';

      const newUser = await prisma.users.create({
        data: {
          username: username.trim(),
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          role: role,
          flagged: false,
        }
      });

      const token = generateToken(newUser);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully. User tier upgraded to Registered.',
        data: {
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            flagged: newUser.flagged,
            createdAt: newUser.created_at,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error during account registration.',
        details: error.message,
      });
    }
  },

  /**
   * Log in an existing user
   * Returns signed JWT on successful bcrypt comparison
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required.',
          code: 'CREDENTIALS_MISSING',
        });
        return;
      }

      const user = await prisma.users.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      if (user.flagged) {
        res.status(403).json({
          success: false,
          error: `Account suspended. Please contact support or admin.`,
          code: 'ACCOUNT_SUSPENDED',
        });
        return;
      }

      const token = generateToken(user);

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            flagged: user.flagged,
            createdAt: user.created_at,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error during authentication.',
        details: error.message,
      });
    }
  },

  /**
   * Get current authenticated user profile
   */
  async getMe(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          flagged: user.flagged,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Update personal profile goals
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { username } = req.body;

      const updated = await prisma.users.update({
        where: { id: userId },
        data: {
          ...(username !== undefined && { username })
        }
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updated,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
