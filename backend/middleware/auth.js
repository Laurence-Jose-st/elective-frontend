import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'lift-it-super-secret-jwt-key-2026-secure-fitness-app';
export const JWT_EXPIRES_IN = '7d';

/**
 * Generate a cryptographically signed JWT token for an authenticated user
 */
export function generateToken(user) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const payload = {
      userId: user.id, // Use actual database ID
      email: user.email,
      role: user.role,
      username: user.username,
    };

    console.log('Generating token for user:', payload.userId);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    console.log('Token generated successfully');
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Middleware: Verify JWT Authentication Token
 * Validates the Authorization header ("Bearer <token>")
 * Checks token validity, user status, and attaches user info to req.user.
 */
export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Access denied. No authentication token provided in Authorization header.',
      code: 'AUTH_TOKEN_MISSING',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if the user exists in the active database and has not been flagged/suspended
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid token: User account no longer exists.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    if (user.flagged) {
      res.status(403).json({
        success: false,
        error: `Account suspended. Please contact administrator.`,
        code: 'ACCOUNT_FLAGGED',
      });
      return;
    }

    req.user = {
      ...decoded,
      role: user.role,
      isFlagged: user.flagged,
      userId: decoded.userId // Use the userId from the token payload
    };

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token. Please log in again.',
      code: 'AUTH_TOKEN_INVALID',
      details: err.message,
    });
  }
}

/**
 * Middleware: Verify Admin Role
 * Requires prior verifyToken middleware to populate req.user.
 * Restricts access exclusively to users with the 'ADMIN' role.
 */
export function verifyAdmin(req, res, next) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required prior to role verification.',
      code: 'UNAUTHENTICATED',
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Admin privilege required to perform this action.',
      code: 'INSUFFICIENT_PERMISSIONS',
      currentRole: req.user.role,
      requiredRole: 'ADMIN',
    });
    return;
  }

  next();
}

/**
 * Middleware: Verify Role (Flexible RBAC Guard)
 * Checks if the authenticated user's role is in the allowedRoles array.
 */
export function verifyRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: User role '${req.user.role}' is not authorized. Required: [${allowedRoles.join(', ')}]`,
        code: 'ROLE_NOT_AUTHORIZED',
        currentRole: req.user.role,
        allowedRoles,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Optional Authentication
 * Attempts to parse JWT if present, but does not block requests without a token.
 * Useful for tiered public/registered endpoints (e.g. food database).
 */
export async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId }
      });
      if (user && !user.flagged) {
        req.user = {
          ...decoded,
          role: user.role,
          isFlagged: user.flagged,
        };
      }
    } catch {
      // Ignore token errors for optional auth; treat as guest
    }
  }

  next();
}