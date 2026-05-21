import { NextFunction, Response, Request } from 'express';
import { db, schema } from '@smt/db';
import { eq, lt } from 'drizzle-orm';

const MAX_REQUESTS = 100;
const WINDOW_MS = 60 * 1000; // 1 minute

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ipHash = req.ipHash || 'unknown';
    const now = Date.now();
    const windowResetDate = new Date(now + WINDOW_MS);

    // Cleanup expired entries FIRST (1% of requests trigger cleanup)
    if (Math.random() < 0.01) {
      await db
        .delete(schema.rateLimits)
        .where(lt(schema.rateLimits.windowResetAt, new Date(now)));
    }

    // Get or create rate limit entry
    let entry = await db
      .select()
      .from(schema.rateLimits)
      .where(eq(schema.rateLimits.ipHash, ipHash))
      .limit(1);

    let rateLimitEntry = entry[0];

    if (rateLimitEntry && rateLimitEntry.windowResetAt.getTime() > now) {
      // Window still active, check limit
      const requestCount = rateLimitEntry.requestCount || 0;
      if (requestCount >= MAX_REQUESTS) {
        res.status(429).json({
          error: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitEntry.windowResetAt.getTime() - now) / 1000),
        });
        return;
      }

      // Increment counter
      await db
        .update(schema.rateLimits)
        .set({ requestCount: requestCount + 1 })
        .where(eq(schema.rateLimits.id, rateLimitEntry.id));
    } else {
      // Create new entry or reset window
      if (rateLimitEntry) {
        await db
          .update(schema.rateLimits)
          .set({
            requestCount: 1,
            windowResetAt: windowResetDate,
          })
          .where(eq(schema.rateLimits.id, rateLimitEntry.id));
      } else {
        await db.insert(schema.rateLimits).values({
          ipHash,
          requestCount: 1,
          windowResetAt: windowResetDate,
        });
      }
    }

    next();
  } catch (error) {
    // On error, allow request through but log it
    console.error('Rate limit check error:', error);
    next();
  }
}
