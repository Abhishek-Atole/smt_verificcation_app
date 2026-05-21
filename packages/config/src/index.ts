import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ALGORITHM: z.enum(['HS256', 'RS256']).default('HS256'),
  JWT_EXPIRY: z.string().default('24h'),
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  HASH_PEPPER: z.string().min(32, 'HASH_PEPPER must be at least 32 characters'),
  ADMIN_IP_ALLOWLIST: z.string().default('127.0.0.1'),
  SESSION_TIMEOUT_MINUTES: z.string().default('30').transform(Number),
  SCAN_TIMEOUT_MS: z.string().default('15000').transform(Number),
  MAX_CONCURRENT_SCANS: z.string().default('20').transform(Number),
  SOCKET_RATE_LIMIT: z.string().default('10').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  DB_POOL_MIN: z.string().default('2').transform(Number),
  DB_POOL_MAX: z.string().default('10').transform(Number),
  DB_POOL_IDLE_MS: z.string().default('30000').transform(Number),
});

function validateEnv() {
  // Allow tests to run without requiring the CI/dev env to be fully populated.
  const rawEnv = { ...process.env } as Record<string, string | undefined>;
  if (rawEnv.NODE_ENV === 'test') {
    rawEnv.DATABASE_URL = rawEnv.DATABASE_URL ?? 'postgresql://localhost/test';
    rawEnv.JWT_SECRET = rawEnv.JWT_SECRET ?? 'test-secret-key-for-tests-only-1234567890123456';
    rawEnv.HASH_PEPPER = rawEnv.HASH_PEPPER ?? 'test-pepper-for-hashing-xxxxxxxxxxxxxx';
  }

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.errors.forEach((error) => {
      console.error(`   ${error.path.join('.')}: ${error.message}`);
    });
    // In tests we should not call process.exit (it kills the test runner). Throw instead so test harness reports the error.
    if (rawEnv.NODE_ENV === 'test') {
      throw new Error('Invalid environment variables for test environment');
    }
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

export type Env = typeof env;
