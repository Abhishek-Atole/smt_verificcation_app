import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('24h'),
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ADMIN_IP_ALLOWLIST: z.string().default('127.0.0.1'),
  SESSION_TIMEOUT_MINUTES: z.string().default('30').transform(Number),
  SCAN_TIMEOUT_MS: z.string().default('15000').transform(Number),
  MAX_CONCURRENT_SCANS: z.string().default('20').transform(Number),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.errors.forEach((error) => {
      console.error(`   ${error.path.join('.')}: ${error.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

export type Env = typeof env;
