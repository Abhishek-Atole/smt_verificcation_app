import { pgTable, uuid, varchar, index } from 'drizzle-orm/pg-core';

export const partReferences = pgTable(
  'part_references',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    internalPartNumber: varchar('internal_part_number', { length: 100 }).notNull().unique(),
    mpn1: varchar('mpn1', { length: 100 }),
    mpn2: varchar('mpn2', { length: 100 }),
    mpn3: varchar('mpn3', { length: 100 }),
    manufacturer: varchar('manufacturer', { length: 100 }),
    category: varchar('category', { length: 100 }),
    description: varchar('description', { length: 500 }),
  },
  (table) => ({
    internalPartNumberIdx: index('part_references_internal_part_number_idx').on(table.internalPartNumber),
    mpn1Idx: index('part_references_mpn1_idx').on(table.mpn1),
    mpn2Idx: index('part_references_mpn2_idx').on(table.mpn2),
    mpn3Idx: index('part_references_mpn3_idx').on(table.mpn3),
    categoryIdx: index('part_references_category_idx').on(table.category),
  })
);
