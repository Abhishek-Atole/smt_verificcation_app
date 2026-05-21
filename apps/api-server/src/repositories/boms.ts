import { db, schema } from '@smt/db';
import { eq, desc, and } from 'drizzle-orm';
import { csvSafeValue, parseSimpleCsv } from '../utils/csv';

export async function getBomById(bomId: string) {
  const bom = await db.select().from(schema.boms).where(eq(schema.boms.id, bomId)).limit(1);
  return bom[0] || null;
}

export async function getBomWithItems(bomId: string) {
  // Single query: join BOMs with items
  const result = await db
    .select()
    .from(schema.boms)
    .leftJoin(schema.bomItems, and(
      eq(schema.bomItems.bomId, schema.boms.id),
      eq(schema.bomItems.isDeleted, false)
    ))
    .where(eq(schema.boms.id, bomId))
    .limit(1);

  if (!result || result.length === 0) {
    return null;
  }

  // Extract BOM and items from joined result
  const bom = result[0].boms;
  const items = result
    .map((row) => row.bom_items)
    .filter((item) => item !== null);

  return {
    ...bom,
    items,
  };
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

export async function importBomItemsFromCsv(bomId: string, csvText: string, createdBy: string) {
  const rows = parseSimpleCsv(csvText);
  if (rows.length < 2) {
    throw new Error('CSV must include a header row and at least one data row');
  }

  const header = rows[0].map((h) => h.toLowerCase());
  const feederIdx = header.indexOf('feederSlot'.toLowerCase());
  const partIdx = header.indexOf('internalPartNumber'.toLowerCase());
  const mpnIdx = header.indexOf('mpn1'.toLowerCase());
  const qtyIdx = header.indexOf('quantity'.toLowerCase());

  if (feederIdx === -1 || partIdx === -1 || qtyIdx === -1) {
    throw new Error('CSV header must include feederSlot, internalPartNumber and quantity columns');
  }

  const itemsToInsert: any[] = [];
  const seenFeeders = new Set<string>();
  const duplicateFeeders: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const feederSlot = csvSafeValue(cols[feederIdx]) as string | null;
    const internalPartNumber = csvSafeValue(cols[partIdx]) as string | null;
    const mpn1 = mpnIdx !== -1 ? (csvSafeValue(cols[mpnIdx]) as string | null) : null;
    const quantityRaw = cols[qtyIdx];
    const quantity = parseInt(String(quantityRaw || '0'), 10) || 0;

    if (!feederSlot) continue;

    if (seenFeeders.has(feederSlot)) {
      duplicateFeeders.push(feederSlot);
      continue;
    }
    seenFeeders.add(feederSlot);

    itemsToInsert.push({
      bomId,
      feederSlot,
      internalPartNumber,
      mpn1,
      quantity,
      createdBy,
      createdAt: new Date(),
    });
  }

  if (duplicateFeeders.length > 0) {
    throw new Error(`Duplicate feeder slots in CSV: ${[...new Set(duplicateFeeders)].join(', ')}`);
  }

  // Check for existing feederSlots in DB
  const existing = await db
    .select()
    .from(schema.bomItems)
    .where(and(eq(schema.bomItems.bomId, bomId), eq(schema.bomItems.isDeleted, false)));

  const existingFeeders = new Set(existing.map((r: any) => String(r.feederSlot)));
  const conflict = itemsToInsert.find((it) => existingFeeders.has(String(it.feederSlot)));
  if (conflict) {
    throw new Error(`Feeder slot conflict with existing BOM items: ${conflict.feederSlot}`);
  }

  // Insert items in a transaction
  const inserted: any[] = [];
  await (db as any).transaction(async (tx: any) => {
    for (const it of itemsToInsert) {
      const res = await tx.insert(schema.bomItems).values(it).returning();
      if (res && res[0]) inserted.push(res[0]);
    }
  });

  return inserted;
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
