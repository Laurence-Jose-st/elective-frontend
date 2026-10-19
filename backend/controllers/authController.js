import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { generateToken } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendPasswordResetConfirmationEmail } from '../utils/emailService.js';

export const authController = {
  /**
   * Register a new user
   * Default role transitions from guest to 'registered'
   */
  async signup(req, res) {
    try {
      const { username, email, password, profile } = req.body;

      console.log('Signup attempt for email:', email);

      if (!username || !email || !password) {
        console.log('Signup failed: Missing required fields');
        res.status(400).json({
          success: false,
          error: 'Username, email, and password are required fields.',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      if (password.length < 6) {
        console.log('Signup failed: Password too short');
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long.',
          code: 'PASSWORD_TOO_SHORT',
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('Signup failed: Invalid email format');
        res.status(400).json({
          success: false,
          error: 'Please provide a valid email address.',
          code: 'INVALID_EMAIL_FORMAT',
        });
        return;
      }

      // Check if user already exists
      console.log('Checking if user already exists');
      const existingUser = await prisma.users.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (existingUser) {
        console.log('Signup failed: User already exists');
        res.status(409).json({
          success: false,
          error: 'An account with this email address already exists. Please log in.',
          code: 'USER_ALREADY_EXISTS',
        });
        return;
      }

      // Hash password using bcrypt with salt factor 10
      console.log('Hashing password');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Default role upon signup is 'REGISTERED' (matching schema)
      const role = 'REGISTERED';

      console.log('Creating new user');
      const newUser = await prisma.users.create({
        data: {
          username: username.trim(),
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          role: role,
          flagged: false,
        }
      });

      console.log('User created successfully:', newUser.id);
      const token = generateToken(newUser);

      if (!token) {
        console.error('Signup failed: Token generation failed');
        res.status(500).json({
          success: false,
          error: 'Failed to generate authentication token.',
          code: 'TOKEN_GENERATION_FAILED',
        });
        return;
      }

      console.log('Signup successful for user:', newUser.id);
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
      console.error('Signup error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Handle specific error types
      if (error.code === 'P2025') {
        res.status(500).json({
          success: false,
          error: 'Database connection error. Please try again later.',
          code: 'DATABASE_ERROR',
        });
        return;
      }

      if (error.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: 'An account with this email address already exists.',
          code: 'USER_ALREADY_EXISTS',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error during account registration.',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

      console.log('Login attempt for email:', email);

      if (!email || !password) {
        console.log('Login failed: Missing credentials');
        res.status(400).json({
          success: false,
          error: 'Email and password are required.',
          code: 'CREDENTIALS_MISSING',
        });
        return;
      }

      if (!process.env.JWT_SECRET) {
        console.error('Login failed: JWT_SECRET not configured');
        res.status(500).json({
          success: false,
          error: 'Server configuration error. Please contact support.',
          code: 'SERVER_CONFIG_ERROR',
        });
        return;
      }

      console.log('Searching for user with email:', email.toLowerCase().trim());
      const user = await prisma.users.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (!user) {
        console.log('Login failed: User not found');
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      console.log('User found, comparing password hash');
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        console.log('Login failed: Password mismatch');
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      if (user.flagged) {
        console.log('Login failed: Account flagged');
        res.status(403).json({
          success: false,
          error: `Account suspended. Please contact support or admin.`,
          code: 'ACCOUNT_SUSPENDED',
        });
        return;
      }

      console.log('Generating token for user:', user.id);
      const token = generateToken(user);

      if (!token) {
        console.error('Login failed: Token generation failed');
        res.status(500).json({
          success: false,
          error: 'Failed to generate authentication token.',
          code: 'TOKEN_GENERATION_FAILED',
        });
        return;
      }

      console.log('Login successful for user:', user.id);
      
      // Check if user is admin
      if (user.role === 'ADMIN') {
        res.status(200).json({
          success: true,
          message: 'Login successful. Redirecting to Admin Dashboard.',
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
            redirectTo: '/admin'
          },
        });
        return;
      }

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
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Handle specific error types
      if (error.code === 'P2025') {
        res.status(500).json({
          success: false,
          error: 'Database connection error. Please try again later.',
          code: 'DATABASE_ERROR',
        });
        return;
      }

      if (error.code === 'P2002') {
        res.status(500).json({
          success: false,
          error: 'Database constraint error.',
          code: 'DATABASE_CONSTRAINT_ERROR',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error during authentication.',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

  /**
   * Request password reset
   * Generates a reset token and sends it via email (console log for now)
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      console.log('Forgot password request for email:', email);

      if (!email) {
        console.log('Forgot password failed: Missing email');
        res.status(400).json({
          success: false,
          error: 'Email is required.',
          code: 'EMAIL_MISSING',
        });
        return;
      }

      const user = await prisma.users.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      // Always return success to prevent email enumeration
      // But only generate token if user exists
      if (user) {
        console.log('User found, generating reset token');
        
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

        console.log('Updating user with reset token');
        await prisma.users.update({
          where: { id: user.id },
          data: {
            reset_token: resetToken,
            reset_token_expires: resetTokenExpires
          }
        });

        console.log('Reset token generated:', resetToken);
        console.log('Reset token expires at:', resetTokenExpires);

        // Send email with reset link
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        console.log('Reset link:', resetLink);

        try {
          await sendPasswordResetEmail(user.email, resetLink);
          console.log('Password reset email sent to:', user.email);
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError.message);
          console.error('Email error details:', emailError);
          console.log('Reset link (email failed):', resetLink);
          // Continue anyway - token is generated and stored
          // The user can still reset password using the link from console for testing
        }
      } else {
        console.log('User not found, but returning success for security');
      }

      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during password reset request.',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * Reset password using token
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      console.log('Reset password request with token');

      if (!token || !newPassword) {
        console.log('Reset password failed: Missing token or password');
        res.status(400).json({
          success: false,
          error: 'Token and new password are required.',
          code: 'CREDENTIALS_MISSING',
        });
        return;
      }

      if (newPassword.length < 6) {
        console.log('Reset password failed: Password too short');
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long.',
          code: 'PASSWORD_TOO_SHORT',
        });
        return;
      }

      console.log('Finding user with reset token');
      const user = await prisma.users.findFirst({
        where: {
          reset_token: token,
          reset_token_expires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        console.log('Reset password failed: Invalid or expired token');
        res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token. Please request a new password reset.',
          code: 'INVALID_TOKEN',
        });
        return;
      }

      console.log('User found, hashing new password');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      console.log('Updating user password and clearing reset token');
      await prisma.users.update({
        where: { id: user.id },
        data: {
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expires: null
        }
      });

      console.log('Password reset successful for user:', user.id);

      // Send confirmation email
      try {
        await sendPasswordResetConfirmationEmail(user.email);
        console.log('Password reset confirmation email sent to:', user.email);
      } catch (emailError) {
        console.error('Failed to send password reset confirmation email:', emailError);
        // Continue anyway - password is already reset
      }

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during password reset.',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },
};
