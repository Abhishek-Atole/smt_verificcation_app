import { Pool } from 'pg';
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

// Create connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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
