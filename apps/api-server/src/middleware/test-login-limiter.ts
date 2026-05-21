import { Request, Response, NextFunction } from 'express';

/**
 * In-memory test-login rate limiter
 * Stores request counts per IP with automatic expiration
 * Rate limit: 10 attempts per 15 minutes per IP
 */

const TEST_LOGIN_LIMIT = 10;
const TEST_LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Get client IP from request
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Rate limit middleware for test-login endpoint
 * Prevents abuse of the development test-login endpoint
 */
export function testLoginRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIP(req);
  const now = Date.now();
  let entry = store.get(ip);

  // Clean up expired entries
  if (entry && entry.resetAt <= now) {
    store.delete(ip);
    entry = undefined;
  }

  // Create new entry if needed
  if (!entry) {
    store.set(ip, {
      count: 1,
      resetAt: now + TEST_LOGIN_WINDOW_MS,
    });
    next();
    return;
  }

  // Check limit
  if (entry.count >= TEST_LOGIN_LIMIT) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    res.status(429).json({
      error: 'TOO_MANY_TEST_LOGINS',
      message: `Test login rate limit exceeded. Maximum ${TEST_LOGIN_LIMIT} attempts per 15 minutes.`,
      retryAfter: retryAfterSeconds,
    });
    return;
  }

  // Increment and allow
  entry.count++;
  next();
}

/**
 * Periodic cleanup of expired entries (runs every 5 minutes)
 */
setInterval(() => {
  const now = Date.now();
  const expired: string[] = [];

  store.forEach((entry, ip) => {
    if (entry.resetAt <= now) {
      expired.push(ip);
    }
  });

  expired.forEach((ip) => store.delete(ip));
}, 5 * 60 * 1000);

export default testLoginRateLimiter;
