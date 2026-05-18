import { pgTable, uuid, varchar, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const boms = pgTable(
  'boms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partNumber: varchar('part_number', { length: 100 }).notNull().unique(),
    revision: varchar('revision', { length: 50 }).notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'restrict' }),
    version: integer('version').notNull().default(0),
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    partNumberIdx: index('boms_part_number_idx').on(table.partNumber),
    isDeletedIdx: index('boms_is_deleted_idx').on(table.isDeleted),
    createdByIdx: index('boms_created_by_idx').on(table.createdBy),
  })
);

export const bomItems = pgTable(
  'bom_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bomId: uuid('bom_id')
      .notNull()
      .references(() => boms.id, { onDelete: 'restrict' }),
    feederSlot: varchar('feeder_slot', { length: 50 }).notNull(),
    internalPartNumber: varchar('internal_part_number', { length: 100 }).notNull(),
    mpn1: varchar('mpn1', { length: 100 }),
    mpn2: varchar('mpn2', { length: 100 }),
    mpn3: varchar('mpn3', { length: 100 }),
    quantity: integer('quantity').notNull(),
    version: integer('version').notNull().default(0),
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    bomIdIdx: index('bom_items_bom_id_idx').on(table.bomId),
    feederSlotIdx: index('bom_items_feeder_slot_idx').on(table.feederSlot),
    internalPartNumberIdx: index('bom_items_internal_part_number_idx').on(table.internalPartNumber),
    isDeletedIdx: index('bom_items_is_deleted_idx').on(table.isDeleted),
  })
);
