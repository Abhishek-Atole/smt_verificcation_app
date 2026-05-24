import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

type RateLimitRow = {
  ipHash: string;
  requestCount: number;
  windowResetAt: Date;
};

let mockRows: RateLimitRow[] = [];

vi.mock('@smt/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: async (value: RateLimitRow | RateLimitRow[]) => {
        const items = Array.isArray(value) ? value : [value];
        mockRows.push(...items.map((row) => ({ ...row })));
      },
    })),
    delete: vi.fn(() => ({
      where: async (condition: any) => {
        const cutoff = condition?.value instanceof Date ? condition.value.getTime() : Date.now();
        mockRows = mockRows.filter((row) => row.windowResetAt.getTime() >= cutoff);
      },
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn((condition: any) => ({
          limit: async (count: number) => {
            if (condition?.type === 'eq' && condition.field === 'ipHash') {
              return mockRows.filter((row) => row.ipHash === condition.value).slice(0, count);
            }

            return mockRows.slice(0, count);
          },
        })),
      })),
    })),
    update: vi.fn(),
  },
  schema: {
    rateLimits: {
      ipHash: 'ipHash',
      requestCount: 'requestCount',
      windowResetAt: 'windowResetAt',
    },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field: unknown, value: unknown) => ({ type: 'eq', field, value })),
  lt: vi.fn((field: unknown, value: unknown) => ({ type: 'lt', field, value })),
}));

describe('Rate Limit Cleanup', () => {
  beforeEach(() => {
    mockRows = [];
  });

  it('cleanup deletes entries where windowResetAt is in the past (lt)', async () => {
    const { cleanupExpiredEntries, _memoryRateLimitStore } = await import('../../src/services/rate-limit-store');

    _memoryRateLimitStore.set('memory-expired', {
      requestCount: 5,
      windowResetAt: Date.now() - 10_000,
    });

    await import('@smt/db').then(({ db, schema }) =>
      db.insert(schema.rateLimits).values({
        ipHash: 'test-hash',
        requestCount: 5,
        windowResetAt: new Date(Date.now() - 10_000),
      })
    );

    await cleanupExpiredEntries();

    const { db, schema } = await import('@smt/db');
    const remaining = await db.select().from(schema.rateLimits).where(eq(schema.rateLimits.ipHash, 'test-hash')).limit(1);

    expect(remaining).toHaveLength(0);
    expect(_memoryRateLimitStore.has('memory-expired')).toBe(false);
  });

  it('cleanup does NOT delete entries where windowResetAt is in the future', async () => {
    const { cleanupExpiredEntries } = await import('../../src/services/rate-limit-store');

    await import('@smt/db').then(({ db, schema }) =>
      db.insert(schema.rateLimits).values({
        ipHash: 'test-hash-2',
        requestCount: 5,
        windowResetAt: new Date(Date.now() + 60_000),
      })
    );

    await cleanupExpiredEntries();

    const { db, schema } = await import('@smt/db');
    const remaining = await db.select().from(schema.rateLimits).where(eq(schema.rateLimits.ipHash, 'test-hash-2')).limit(1);

    expect(remaining).toHaveLength(1);
  });
});