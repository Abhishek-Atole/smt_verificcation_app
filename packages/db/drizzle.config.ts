import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/smt_verification';

export default {
  schema: './src/schema/',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString,
  },
} satisfies Config;
