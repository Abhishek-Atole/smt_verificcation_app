import { Router, Request, Response, NextFunction } from 'express';
import * as userRepo from '../repositories/users';
import { authMiddleware, requireRole } from '../middleware/auth';
import { ValidationError, NotFoundError, ConflictError } from '../errors';

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
      const user = await userRepo.getUserById(req.params.userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      res.json({ data: user });
    } catch (err) {
      next(err);
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
      const { email, passwordHash, role, firstName, lastName } = req.body;

      if (!email || !passwordHash || !role) {
        throw new ValidationError('email, passwordHash, and role are required');
      }

      const existingUser = await userRepo.getUserByEmail(email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      const validRoles = ['admin', 'supervisor', 'qa', 'operator'];
      if (!validRoles.includes(role)) {
        throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

      const user = await userRepo.createUser({
        email,
        passwordHash,
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
      // Users can update themselves or admins can update anyone
      if (req.userId !== req.params.userId && req.userRole !== 'admin') {
        throw new ValidationError('You can only update your own profile');
      }

      const user = await userRepo.updateUser(req.params.userId, req.body);
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
