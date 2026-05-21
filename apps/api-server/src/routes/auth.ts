import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@smt/config';
import * as userRepo from '../repositories/users';
import { ValidationError, AuthError } from '../errors';
import { loginSchema } from '../utils/validation-schemas';
import { testLoginRateLimiter } from '../middleware/test-login-limiter';

const router = Router();

/**
 * Real login endpoint - authenticates with email and password
 * Sets JWT token as HttpOnly cookie
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError(
        `Invalid request: ${validation.error.errors.map((e) => `${e.path.join('.')} - ${e.message}`).join('; ')}`
      );
    }

    const { email, password } = validation.data;
    const user = await userRepo.authenticateUser(email, password);

    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      },
      env.JWT_SECRET,
      { algorithm: env.JWT_ALGORITHM as any }
    );

    // Set HttpOnly cookie - NOT returned in body
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return user data (without token)
    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Public test login endpoint - returns a JWT token for development/testing
 * This is NOT secure and should only be used in development mode
 * Sets JWT token as HttpOnly cookie
 * Rate limited: 10 attempts per 15 minutes per IP
 */
if (env.NODE_ENV !== 'production') {
  router.post('/test-login', testLoginRateLimiter, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // For development/testing only - create an admin token
      const token = jwt.sign(
        {
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 'admin',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        },
        env.JWT_SECRET,
        { algorithm: env.JWT_ALGORITHM as any }
      );

      // Set HttpOnly cookie - NOT returned in body
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Return user data (without token in body)
      res.json({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'admin',
          },
        },
      });
    } catch (err) {
      next(err);
    }
  });
}

/**
 * Logout endpoint - clears the authentication cookie
 */
router.post('/logout', async (_req: Request, res: Response, _next: NextFunction) => {
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ message: 'Logged out successfully' });
});

export default router;
