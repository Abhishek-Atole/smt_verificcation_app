import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '@smt/config';
import * as userSchemas from './schema/users';
import * as bomSchemas from './schema/boms';
import * as sessionSchemas from './schema/sessions';
import * as auditSchemas from './schema/audit';
import * as shiftSchemas from './schema/shifts';
import * as adminSchemas from './schema/admin';
import * as analyticsSchemas from './schema/analytics';
import * as referenceSchemas from './schema/references';
import * as rateLimitSchemas from './schema/rate-limits';

// Create connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  min: env.DB_POOL_MIN,
  idleTimeoutMillis: env.DB_POOL_IDLE_MS,
  connectionTimeoutMillis: 2000,
});

// Error handling for pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize Drizzle ORM
export const db = drizzle(pool);

// Export schema
export const schema = {
  // Users
  users: userSchemas.users,
  userSessions: userSchemas.userSessions,
  notifications: userSchemas.notifications,

  // BOMs
  boms: bomSchemas.boms,
  bomItems: bomSchemas.bomItems,

  // Sessions
  sessions: sessionSchemas.sessions,
  scans: sessionSchemas.scans,
  scanValidations: sessionSchemas.scanValidations,

  // Audit
  auditLogs: auditSchemas.auditLogs,
  systemLogs: auditSchemas.systemLogs,

  // Shifts
  shifts: shiftSchemas.shifts,
  performanceMetrics: shiftSchemas.performanceMetrics,

  // Admin
  adminSettings: adminSchemas.adminSettings,
  ipAllowlist: adminSchemas.ipAllowlist,

  // Analytics
  analytics: analyticsSchemas.analytics,
  reports: analyticsSchemas.reports,
  exportJobs: analyticsSchemas.exportJobs,

  // References
  partReferences: referenceSchemas.partReferences,

  // Rate Limiting
  rateLimits: rateLimitSchemas.rateLimits,
};

// Health check helper
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch {
    return false;
  }
}
