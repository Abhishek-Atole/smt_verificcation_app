import Redis from 'ioredis';
import { env } from '@smt/config';
import { db, schema } from '@smt/db';
import { eq, lt } from 'drizzle-orm';
import { logger } from './logger';

type StoreResult = {
  allowed: boolean;
  retryAfter: number;
  strategy: 'redis' | 'database' | 'memory';
};

type MemoryEntry = {
  requestCount: number;
  windowResetAt: number;
};

const memoryStore = new Map<string, MemoryEntry>();
let databaseStoreAvailable = true;

export async function cleanupExpiredEntries(now = Date.now()): Promise<void> {
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.windowResetAt <= now) {
      memoryStore.delete(key);
    }
  }

  if (!databaseStoreAvailable) {
    return;
  }

  try {
    await db.delete(schema.rateLimits).where(lt(schema.rateLimits.windowResetAt, new Date(now)));
  } catch (error) {
    logger.warn('Rate limiter: cleanup failed', { error: error instanceof Error ? error.message : String(error) });
  }
}

setInterval(() => {
  void cleanupExpiredEntries().catch((error) => {
    logger.warn('Rate limiter: periodic cleanup failed', { error: error instanceof Error ? error.message : String(error) });
  });
}, 60_000).unref();

const redisConfigEnabled = env.RATE_LIMIT_REDIS_ENABLED && Boolean(env.REDIS_URL);
let redisClient: Redis | null = null;
let redisClientInitPromise: Promise<Redis | null> | null = null;

function getRedisClient(): Promise<Redis | null> {
  if (!redisConfigEnabled) {
    return Promise.resolve(null);
  }

  if (redisClient) {
    return Promise.resolve(redisClient);
  }

  if (!redisClientInitPromise) {
    redisClientInitPromise = (async () => {
      try {
        const client = new Redis(env.REDIS_URL as string, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
          connectTimeout: 5_000,
        });

        client.on('error', (error) => {
          logger.warn('Rate limiter Redis client error', { error: error.message });
        });

        await client.connect();
        redisClient = client;
        logger.info('Rate limiter Redis client connected');
        return client;
      } catch (error) {
        logger.warn('Rate limiter Redis client unavailable', { error: error instanceof Error ? error.message : String(error) });
        redisClient = null;
        return null;
      }
    })();
  }

  return redisClientInitPromise;
}

async function consumeRedisRateLimit(ipHash: string, maxRequests: number, windowMs: number): Promise<StoreResult | null> {
  const client = await getRedisClient();
  if (!client) return null;

  const key = `${env.RATE_LIMIT_REDIS_PREFIX}:${ipHash}`;
  const script = `
    local current = redis.call('INCR', KEYS[1])
    if current == 1 then
      redis.call('PEXPIRE', KEYS[1], ARGV[1])
    end
    local ttl = redis.call('PTTL', KEYS[1])
    return { current, ttl }
  `;

  const result = (await client.eval(script, 1, key, String(windowMs))) as [number, number];
  const current = Number(result[0] || 0);
  const ttlMs = Number(result[1] || windowMs);

  if (current > maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil(ttlMs / 1000)),
      strategy: 'redis',
    };
  }

  return {
    allowed: true,
    retryAfter: 0,
    strategy: 'redis',
  };
}

async function consumeDatabaseRateLimit(ipHash: string, maxRequests: number, windowMs: number): Promise<StoreResult | null> {
  if (!databaseStoreAvailable) {
    return null;
  }

  const now = Date.now();
  const windowResetDate = new Date(now + windowMs);

  try {
    if (Math.random() < 0.01) {
      await db.delete(schema.rateLimits).where(lt(schema.rateLimits.windowResetAt, new Date(now)));
    }

    const rows = await db.select().from(schema.rateLimits).where(eq(schema.rateLimits.ipHash, ipHash)).limit(1);
    const entry = rows[0];

    if (entry && entry.windowResetAt.getTime() > now) {
      const requestCount = entry.requestCount || 0;
      if (requestCount >= maxRequests) {
        return {
          allowed: false,
          retryAfter: Math.ceil((entry.windowResetAt.getTime() - now) / 1000),
          strategy: 'database',
        };
      }

      await db.update(schema.rateLimits).set({ requestCount: requestCount + 1 }).where(eq(schema.rateLimits.id, entry.id));
    } else if (entry) {
      await db.update(schema.rateLimits).set({ requestCount: 1, windowResetAt: windowResetDate }).where(eq(schema.rateLimits.id, entry.id));
    } else {
      await db.insert(schema.rateLimits).values({ ipHash, requestCount: 1, windowResetAt: windowResetDate });
    }

    return { allowed: true, retryAfter: 0, strategy: 'database' };
  } catch (error) {
    logger.warn('Rate limiter: database store unavailable', { error: error instanceof Error ? error.message : String(error), ipHash });
    databaseStoreAvailable = false;
    return null;
  }
}

function consumeMemoryRateLimit(ipHash: string, maxRequests: number, windowMs: number): StoreResult {
  const now = Date.now();
  const existing = memoryStore.get(ipHash);

  if (existing && existing.windowResetAt > now) {
    if (existing.requestCount >= maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((existing.windowResetAt - now) / 1000)),
        strategy: 'memory',
      };
    }

    existing.requestCount += 1;
    memoryStore.set(ipHash, existing);
    return { allowed: true, retryAfter: 0, strategy: 'memory' };
  }

  memoryStore.set(ipHash, { requestCount: 1, windowResetAt: now + windowMs });
  return { allowed: true, retryAfter: 0, strategy: 'memory' };
}

export async function consumeRateLimit(ipHash: string, maxRequests: number, windowMs: number): Promise<StoreResult> {
  if (redisConfigEnabled) {
    try {
      const redisResult = await consumeRedisRateLimit(ipHash, maxRequests, windowMs);
      if (redisResult) {
        return redisResult;
      }
    } catch (error) {
      logger.warn('Rate limiter: Redis store unavailable', { error: error instanceof Error ? error.message : String(error), ipHash });
    }
  }

  const databaseResult = await consumeDatabaseRateLimit(ipHash, maxRequests, windowMs);
  if (databaseResult) {
    return databaseResult;
  }

  logger.info('Rate limiter: using in-memory fallback', { ipHash });
  return consumeMemoryRateLimit(ipHash, maxRequests, windowMs);
}

export function getRateLimitStrategyStatus() {
  return {
    redisEnabled: redisConfigEnabled,
    redisConfigured: Boolean(env.REDIS_URL),
  };
}

export { memoryStore as _memoryRateLimitStore };