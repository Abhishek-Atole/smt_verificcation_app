import type { Config } from 'drizzle-kit';

export default {
  schema: './packages/db/src/schema/',
  out: './packages/db/drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  },
} satisfies Config;
