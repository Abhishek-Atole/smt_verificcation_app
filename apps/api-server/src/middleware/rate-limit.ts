import { NextFunction, Response } from 'express';
import { Request } from '@smt/api-types';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

export function rateLimitMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const ipHash = req.ipHash || 'unknown';
    const now = Date.now();

    const entry = rateLimits.get(ipHash);

    if (entry && now < entry.resetAt) {
      if (entry.count >= MAX_REQUESTS) {
        _res.status(429).json({
          error: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        });
        return;
      }

      entry.count++;
    } else {
      rateLimits.set(ipHash, {
        count: 1,
        resetAt: now + WINDOW_MS,
      });
    }

    // Clean up old entries periodically
    if (rateLimits.size > 1000) {
      for (const [key, value] of rateLimits.entries()) {
        if (now >= value.resetAt) {
          rateLimits.delete(key);
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
