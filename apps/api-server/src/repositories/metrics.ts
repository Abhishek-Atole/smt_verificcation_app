import { db, schema } from '@smt/db';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export async function getMetricsForDate(date: string) {
  const metrics = await db
    .select()
    .from(schema.performanceMetrics)
    .where(eq(schema.performanceMetrics.date, date));
  return metrics || [];
}

export async function getMetricsDateRange(startDate: string, endDate: string) {
  return await db
    .select()
    .from(schema.performanceMetrics)
    .where(and(gte(schema.performanceMetrics.date, startDate), lte(schema.performanceMetrics.date, endDate)))
    .orderBy(desc(schema.performanceMetrics.date));
}

export async function updateMetrics(data: {
  date: string;
  firstPassYield: string;
  feedersPerMinute: string;
  averageCycleTime: string;
  oeeScore: string;
  availability: string;
  performance: string;
  quality: string;
}) {
  const existing = await db
    .select()
    .from(schema.performanceMetrics)
    .where(eq(schema.performanceMetrics.date, data.date))
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(schema.performanceMetrics)
      .set(data)
      .where(eq(schema.performanceMetrics.date, data.date))
      .returning();
  }

  return await db.insert(schema.performanceMetrics).values(data).returning();
}

export async function recordAuditLog(data: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: string;
  newValues?: string;
  ipAddress: string;
}) {
  // Validate and cast enum values
  const validActions = ['CREATE_BOM', 'UPDATE_BOM', 'DELETE_BOM', 'START_SESSION', 'COMPLETE_SESSION', 'CANCEL_SESSION'];
  const action = validActions.includes(data.action) ? (data.action as any) : 'CREATE_BOM';
  
  return await db.insert(schema.auditLogs).values({
    userId: data.userId,
    action,
    entityType: data.entityType,
    entityId: data.entityId,
    oldValues: data.oldValues,
    newValues: data.newValues,
    ipAddress: data.ipAddress,
  }).returning();
}

export async function recordSystemLog(data: {
  level: string;
  message: string;
  context?: string;
  stackTrace?: string;
}) {
  // Validate and cast enum values
  const validLevels = ['INFO', 'WARN', 'ERROR'];
  const level = validLevels.includes(data.level) ? (data.level as any) : 'INFO';
  
  return await db.insert(schema.systemLogs).values({
    level,
    message: data.message,
    context: data.context,
    stackTrace: data.stackTrace,
  }).returning();
}
