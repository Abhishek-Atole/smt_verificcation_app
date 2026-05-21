import { Request, Response, NextFunction } from 'express';

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch any unhandled promise rejections
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Async method wrapper for repository/service functions
 * Ensures errors are properly propagated
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Error in wrapped function:', error);
      throw error;
    }
  };
}
