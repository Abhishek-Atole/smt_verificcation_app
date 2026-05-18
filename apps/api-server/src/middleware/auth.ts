import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { env } from '@smt/config';
import { AuthPayload, Request } from '@smt/api-types';
import { AuthError } from '../errors';

export function authMiddleware(req: Request & any, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthError('Missing authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthError('Invalid authorization header format');
    }

    const token = parts[1];
    const payload = verify(token, env.JWT_SECRET) as AuthPayload;

    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.userRole = payload.role;

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      next(error);
    } else if (error instanceof Error) {
      next(new AuthError(error.message));
    } else {
      next(new AuthError('Authentication failed'));
    }
  }
}

export function optionalAuthMiddleware(req: Request & any, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = parts[1];
    const payload = verify(token, env.JWT_SECRET) as AuthPayload;

    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.userRole = payload.role;

    next();
  } catch {
    // Silently fail for optional auth
    next();
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request & any, _res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      next(new AuthError('User role not found'));
      return;
    }

    if (!roles.includes(req.userRole)) {
      next(new AuthError(`Requires one of: ${roles.join(', ')}`));
      return;
    }

    next();
  };
}
