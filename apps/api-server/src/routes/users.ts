import { Router, Request, Response, NextFunction } from 'express';
import * as userRepo from '../repositories/users';
import { authMiddleware, requireRole } from '../middleware/auth';
import { ValidationError, NotFoundError, ConflictError } from '../errors';
import { createUserSchema, updateUserSchema } from '../utils/validation-schemas';

const router = Router();

// List all users
router.get(
  '/',
  authMiddleware,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const users = await userRepo.listUsers(limit, offset);
      res.json({
        data: users,
        limit,
        offset,
        total: users.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Get user by ID
router.get(
  '/:userId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only allow admins or the user themselves to view the record
      if (req.userRole !== 'admin' && req.userId !== req.params.userId) {
        return res.status(403).json({ error: 'FORBIDDEN' });
      }

      const user = await userRepo.getUserById(req.params.userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // sanitize sensitive fields
      const safeUser = { ...user } as any;
      if ('passwordHash' in safeUser) delete safeUser.passwordHash;

      return res.json({ data: safeUser });
    } catch (err) {
      return next(err);
    }
  }
);

// Create user (admin only)
router.post(
  '/',
  authMiddleware,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validation = createUserSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError(
          `Invalid request: ${validation.error.errors.map((e) => `${e.path.join('.')} - ${e.message}`).join('; ')}`
        );
      }

      const { email, password, role, firstName, lastName } = validation.data;

      const existingUser = await userRepo.getUserByEmail(email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      const user = await userRepo.createUser({
        email,
        password,
        role,
        firstName,
        lastName,
      });

      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  }
);

// Update user
router.patch(
  '/:userId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validation = updateUserSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError(
          `Invalid request: ${validation.error.errors.map((e) => `${e.path.join('.')} - ${e.message}`).join('; ')}`
        );
      }

      // Users can update themselves or admins can update anyone
      if (req.userId !== req.params.userId && req.userRole !== 'admin') {
        throw new ValidationError('You can only update your own profile');
      }

      const user = await userRepo.updateUser(req.params.userId, validation.data);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  }
);

// Delete user (admin only)
router.delete(
  '/:userId',
  authMiddleware,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userRepo.deleteUser(req.params.userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({ data: user, message: 'User deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
