import { db, schema } from '@smt/db';
import { eq, desc, and } from 'drizzle-orm';

export async function getBomById(bomId: string) {
  const bom = await db.select().from(schema.boms).where(eq(schema.boms.id, bomId)).limit(1);
  return bom[0] || null;
}

export async function getBomByPartNumber(partNumber: string) {
  const bom = await db
    .select()
    .from(schema.boms)
    .where(and(eq(schema.boms.partNumber, partNumber), eq(schema.boms.isDeleted, false)))
    .limit(1);
  return bom[0] || null;
}

export async function listBoms(limit: number = 50, offset: number = 0) {
  return await db
    .select()
    .from(schema.boms)
    .where(eq(schema.boms.isDeleted, false))
    .orderBy(desc(schema.boms.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function createBom(data: {
  partNumber: string;
  revision: string;
  createdBy: string;
  approvedBy?: string;
}) {
  const result = await db.insert(schema.boms).values(data).returning();
  return result[0];
}

export async function updateBom(bomId: string, data: Partial<typeof schema.boms.$inferInsert>) {
  const result = await db
    .update(schema.boms)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.boms.id, bomId))
    .returning();
  return result[0] || null;
}

export async function deleteBom(bomId: string) {
  const result = await db
    .update(schema.boms)
    .set({ isDeleted: true, deletedAt: new Date() })
    .where(eq(schema.boms.id, bomId))
    .returning();
  return result[0] || null;
}

export async function getBomItems(bomId: string) {
  return await db
    .select()
    .from(schema.bomItems)
    .where(and(eq(schema.bomItems.bomId, bomId), eq(schema.bomItems.isDeleted, false)));
}

export async function addBomItem(data: typeof schema.bomItems.$inferInsert) {
  const result = await db.insert(schema.bomItems).values(data).returning();
  return result[0];
}

export async function deleteBomItem(itemId: string) {
  const result = await db
    .update(schema.bomItems)
    .set({ isDeleted: true, deletedAt: new Date() })
    .where(eq(schema.bomItems.id, itemId))
    .returning();
  return result[0] || null;
}
