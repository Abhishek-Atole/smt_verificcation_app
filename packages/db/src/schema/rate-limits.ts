import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  ipHash: text('ip_hash').notNull().unique(),
  requestCount: integer('request_count').default(0),
  windowResetAt: timestamp('window_reset_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type RateLimit = typeof rateLimits.$inferSelect;
export type RateLimitInsert = typeof rateLimits.$inferInsert;
