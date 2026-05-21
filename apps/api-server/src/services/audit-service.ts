import { db, schema } from '@smt/db';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { logger } from './logger';

// ── Sensitive field names to redact from audit logs ─────────────────────────
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'token',
  'jwt',
  'secret',
  'key',
  'apikey',
  'api_key',
]);

/**
 * Recursively strip sensitive fields from an object.
 * Used before recording audit logs to prevent secrets from being persisted.
 */
function stripSensitive(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(stripSensitive);
  }

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      clean[k] = '[REDACTED]';
    } else {
      clean[k] = stripSensitive(v);
    }
  }

  return clean;
}

// ── Audit action types (must match database schema enum) ─────────────────────

export type AuditAction =
  | 'CREATE_BOM'
  | 'UPDATE_BOM'
  | 'DELETE_BOM'
  | 'CREATE_SESSION'
  | 'UPDATE_SESSION'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER';

export interface AuditLogInput {
  userId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress: string;
}

// ── Record audit log ───────────────────────────────────────────────────────

/**
 * Record an audit log entry.
 * Failures are logged but do NOT break the main operation.
 * Sensitive fields are automatically redacted.
 */
export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const entry = {
      userId: input.userId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      oldValues: input.oldValue ? JSON.stringify(stripSensitive(input.oldValue)) : null,
      newValues: input.newValue ? JSON.stringify(stripSensitive(input.newValue)) : null,
      ipAddress: input.ipAddress,
    };

    await db.insert(schema.auditLogs).values(entry as any);
  } catch (err) {
    // Audit log failure must NEVER break the main operation
    logger.error('Failed to write audit log', err);
  }
}

// ── Query audit logs ───────────────────────────────────────────────────────

/**
 * Get all audit logs for a specific entity.
 * Results ordered by most recent first, limited to 500 entries.
 */
export async function getEntityLogs(
  entityType: string,
  entityId: string,
  limit = 500,
) {
  return db
    .select()
    .from(schema.auditLogs)
    .where(and(eq(schema.auditLogs.entityType, entityType), eq(schema.auditLogs.entityId, entityId)))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit);
}

/**
 * Get audit logs for a specific user (as actor).
 * Results ordered by most recent first, limited to 500 entries.
 */
export async function getUserAuditLogs(
  userId: string,
  limit = 500,
) {
  return db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.userId, userId))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit);
}

/**
 * Get audit logs filtered by action type.
 * Results ordered by most recent first, limited to 500 entries.
 */
export async function getAuditLogsByAction(
  action: AuditAction,
  limit = 500,
) {
  return db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.action, action))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit);
}

/**
 * Get all audit logs within a date range.
 * Results ordered by most recent first, limited to 1000 entries.
 * Prevents unbounded queries that could return excessive data.
 */
export async function getAuditLogsDateRange(
  startDate: Date,
  endDate: Date,
  limit = 1000,
) {
  if (startDate > endDate) {
    throw new Error('startDate must be before endDate');
  }

  return db
    .select()
    .from(schema.auditLogs)
    .where(and(
      gte(schema.auditLogs.createdAt, startDate),
      lte(schema.auditLogs.createdAt, endDate),
    ))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit);
}

/**
 * Get audit log statistics for dashboard/analytics.
 * Counts actions by type over the last N hours.
 */
export async function getAuditLogStats(hours = 24): Promise<Record<AuditAction, number>> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const records = await db
    .select({
      action: schema.auditLogs.action,
    })
    .from(schema.auditLogs)
    .where(gte(schema.auditLogs.createdAt, cutoff));

  const stats: Record<string, number> = {};
  for (const record of records) {
    stats[record.action] = (stats[record.action] ?? 0) + 1;
  }

  return stats as Record<AuditAction, number>;
}
