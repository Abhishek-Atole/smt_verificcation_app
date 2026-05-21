import { db, schema } from '@smt/db';
import { eq, and, gte, lte, or } from 'drizzle-orm';

export interface SessionStats {
  sessionId: string;
  bomId: string;
  operatorId: string;
  status: string;
  totalScans: number;
  passCount: number;
  failCount: number;
  fpy: number; // First Pass Yield (0-100)
  averageCycleTime: number; // seconds per scan
  duration: number; // seconds
  feederCoverage: number; // percentage of BOM covered
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionSummary {
  sessionId: string;
  status: string;
  scans: number;
  fpy: number;
  duration: number;
  operator: string;
}

/**
 * Calculate comprehensive statistics for a session
 */
export async function calculateSessionStats(sessionId: string): Promise<SessionStats> {
  // Get session
  const sessions = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .limit(1);

  if (!sessions.length) {
    throw new Error('Session not found');
  }

  const session = sessions[0];

  // Get all scans for session
  const scans = await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.sessionId, sessionId));

  // Get BOM items to calculate feeder coverage
  const bomItems = await db
    .select()
    .from(schema.bomItems)
    .where(eq(schema.bomItems.bomId, session.bomId));

  // Calculate metrics
  const passCount = scans.filter((s) => s.validationResult === 'pass').length;
  const failCount = scans.filter((s) => s.validationResult === 'fail').length;
  const countable = passCount + failCount;
  const fpy = countable > 0 ? (passCount / countable) * 100 : 0;

  const durationSeconds =
    (session.updatedAt.getTime() - session.createdAt.getTime()) / 1000;
  const averageCycleTime = scans.length > 0 ? durationSeconds / scans.length : 0;

  // Feeder coverage: unique feeders scanned / total feeders in BOM
  const uniqueFeeders = new Set(scans.map((s) => s.feederSlot));
  const feederCoverage =
    bomItems.length > 0 ? (uniqueFeeders.size / bomItems.length) * 100 : 0;

  return {
    sessionId: session.id,
    bomId: session.bomId,
    operatorId: session.operator,
    status: session.status,
    totalScans: scans.length,
    passCount,
    failCount,
    fpy,
    averageCycleTime,
    duration: Math.round(durationSeconds),
    feederCoverage,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

/**
 * Get lightweight summary for multiple sessions
 */
export async function getSessionsSummary(
  sessionIds: string[],
): Promise<SessionSummary[]> {
  if (sessionIds.length === 0) return [];

  // Build WHERE clause with OR conditions for each sessionId
  const sessions = await db
    .select()
    .from(schema.sessions)
    .where(
      or(
        ...sessionIds.map((id) => eq(schema.sessions.id, id)),
      ),
    );

  const users = await db.select().from(schema.users);
  const userMap = new Map(users.map((u) => [u.id, u.email || 'Unknown']));

  const summaries: SessionSummary[] = [];

  for (const session of sessions) {
    const scans = await db
      .select()
      .from(schema.scans)
      .where(eq(schema.scans.sessionId, session.id));

    const passCount = scans.filter((s) => s.validationResult === 'pass').length;
    const failCount = scans.filter((s) => s.validationResult === 'fail').length;
    const countable = passCount + failCount;
    const fpy = countable > 0 ? (passCount / countable) * 100 : 0;

    const durationSeconds =
      (session.updatedAt.getTime() - session.createdAt.getTime()) / 1000;

    summaries.push({
      sessionId: session.sessionId,
      status: session.status,
      scans: scans.length,
      fpy,
      duration: Math.round(durationSeconds),
      operator: userMap.get(session.operator) || 'Unknown',
    });
  }

  return summaries;
}

/**
 * Calculate duration between two timestamps
 */
export function calculateSessionDuration(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / 1000);
}

/**
 * Get elapsed time for active session (from start to now)
 */
export function getSessionElapsed(startTime: Date): number {
  return Math.round((Date.now() - startTime.getTime()) / 1000);
}

/**
 * Compare two session stats to calculate trending
 */
export function compareSessionStats(
  current: SessionStats,
  previous: SessionStats,
): {
  fpyTrend: number; // percentage point change
  cycleTimeTrend: number; // percentage change
  scanRateTrend: number; // percentage change
} {
  return {
    fpyTrend: current.fpy - previous.fpy,
    cycleTimeTrend:
      previous.averageCycleTime > 0
        ? ((current.averageCycleTime - previous.averageCycleTime) /
            previous.averageCycleTime) *
          100
        : 0,
    scanRateTrend:
      previous.totalScans > 0
        ? ((current.totalScans - previous.totalScans) / previous.totalScans) *
          100
        : 0,
  };
}

/**
 * Get sessions within a date range and optional status
 */
export async function getSessionsByDateRange(
  startDate: Date,
  endDate: Date,
  status?: string,
): Promise<SessionStats[]> {
  const conditions: any[] = [
    gte(schema.sessions.createdAt, startDate),
    lte(schema.sessions.createdAt, endDate),
  ];

  if (status) {
    conditions.push(eq(schema.sessions.status, status as any));
  }

  const sessions = await db
    .select()
    .from(schema.sessions)
    .where(and(...conditions));

  const stats: SessionStats[] = [];

  for (const session of sessions) {
    stats.push(await calculateSessionStats(session.id));
  }

  return stats;
}

/**
 * Get all sessions for a specific operator
 */
export async function getOperatorSessions(operatorId: string): Promise<SessionStats[]> {
  const sessions = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.operator, operatorId));

  const stats: SessionStats[] = [];

  for (const session of sessions) {
    stats.push(await calculateSessionStats(session.id));
  }

  return stats;
}

/**
 * Get all sessions for a specific BOM
 */
export async function getBomSessions(bomId: string): Promise<SessionStats[]> {
  const sessions = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.bomId, bomId));

  const stats: SessionStats[] = [];

  for (const session of sessions) {
    stats.push(await calculateSessionStats(session.id));
  }

  return stats;
}
