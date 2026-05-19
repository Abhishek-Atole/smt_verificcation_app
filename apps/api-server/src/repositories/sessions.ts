import { db, schema } from '@smt/db';
import { eq, desc, and } from 'drizzle-orm';
import { getSessionId } from '../utils';

export async function getSessionById(sessionId: string) {
  const session = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .limit(1);
  return session[0] || null;
}

export async function getSessionBySessionId(sessionId: string) {
  const session = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.sessionId, sessionId))
    .limit(1);
  return session[0] || null;
}

export async function listSessions(
  bomId?: string,
  operator?: string,
  status?: string,
  limit: number = 50,
  offset: number = 0
) {
  const conditions = [];
  if (bomId) conditions.push(eq(schema.sessions.bomId, bomId));
  if (operator) conditions.push(eq(schema.sessions.operator, operator));
  if (status) conditions.push(eq(schema.sessions.status, status as any));

  let query = db.select().from(schema.sessions);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query.orderBy(desc(schema.sessions.createdAt)).limit(limit).offset(offset);
}

export async function createSession(data: {
  bomId: string;
  operator: string;
  status: string;
}) {
  const sessionId = getSessionId();
  const validStatuses = ['active', 'paused', 'completed', 'cancelled'];
  const status = validStatuses.includes(data.status) ? (data.status as any) : 'active';
  
  const result = await db
    .insert(schema.sessions)
    .values({
      bomId: data.bomId,
      operator: data.operator,
      sessionId,
      status,
      totalScans: 0,
      passCount: 0,
      failCount: 0,
    })
    .returning();
  return result[0];
}

export async function updateSession(
  sessionId: string,
  data: Partial<typeof schema.sessions.$inferInsert>
) {
  const updateData: any = { ...data, updatedAt: new Date() };
  
  // Handle status enum
  if (updateData.status && typeof updateData.status === 'string') {
    const validStatuses = ['active', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(updateData.status)) {
      updateData.status = 'active';
    }
  }
  
  const result = await db
    .update(schema.sessions)
    .set(updateData)
    .where(eq(schema.sessions.id, sessionId))
    .returning();
  return result[0] || null;
}

export async function recordScan(data: {
  sessionId: string;
  scannedValue: string;
  validationResult: string;
  feederSlot?: string;
  internalPartNumber?: string;
  matchedMPN?: string;
}) {
  const validResults = ['pass', 'fail', 'error', 'pending'];
  const validationResult = validResults.includes(data.validationResult) ? (data.validationResult as any) : 'pending';
  
  const result = await db.insert(schema.scans).values({
    sessionId: data.sessionId,
    scannedValue: data.scannedValue,
    validationResult,
    feederSlot: data.feederSlot,
    internalPartNumber: data.internalPartNumber,
    matchedMPN: data.matchedMPN,
  }).returning();
  return result[0];
}

export async function getScans(sessionId: string, limit: number = 100, offset: number = 0) {
  return await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.sessionId, sessionId))
    .orderBy(desc(schema.scans.timestamp))
    .limit(limit)
    .offset(offset);
}

export async function recordValidation(data: {
  scanId: string;
  stage: number;
  passed: boolean;
  details?: string;
}) {
  const result = await db.insert(schema.scanValidations).values(data).returning();
  return result[0];
}
