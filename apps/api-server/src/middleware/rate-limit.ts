import { NextFunction, Response, Request } from 'express';
import { env } from '@smt/config';
import { logger } from '../services/logger';
import { consumeRateLimit, getRateLimitStrategyStatus } from '../services/rate-limit-store';

const MAX_REQUESTS = env.RATE_LIMIT_MAX_REQUESTS;
const WINDOW_MS = env.RATE_LIMIT_WINDOW_MS;

let loggedStrategyStatus = false;

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ipHash = (req as any).ipHash || 'unknown';
  if (!loggedStrategyStatus) {
    loggedStrategyStatus = true;
    logger.info('Rate limiter strategy status', getRateLimitStrategyStatus());
  }

  try {
    const result = await consumeRateLimit(ipHash, MAX_REQUESTS, WINDOW_MS);

    if (!result.allowed) {
      res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
        strategy: result.strategy,
      });
      return;
    }

    next();
    return;
  } catch (error) {
    logger.error('Rate limit middleware failed open', error, { ipHash });
    next();
  }
}
