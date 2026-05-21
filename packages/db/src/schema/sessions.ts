import { pgTable, uuid, varchar, integer, timestamp, index, boolean } from 'drizzle-orm/pg-core';
import { boms } from './boms';
import { users } from './users';

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: varchar('session_id', { length: 100 }).notNull().unique(),
    bomId: uuid('bom_id')
      .notNull()
      .references(() => boms.id, { onDelete: 'restrict' }),
    operator: uuid('operator')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: varchar('status', { length: 50, enum: ['active', 'completed', 'paused', 'cancelled'] }).notNull(),
    totalScans: integer('total_scans').notNull().default(0),
    passCount: integer('pass_count').notNull().default(0),
    failCount: integer('fail_count').notNull().default(0),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('sessions_session_id_idx').on(table.sessionId),
    bomIdIdx: index('sessions_bom_id_idx').on(table.bomId),
    operatorIdx: index('sessions_operator_idx').on(table.operator),
    statusIdx: index('sessions_status_idx').on(table.status),
  })
);

export const scans = pgTable(
  'scans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'restrict' }),
    scannedValue: varchar('scanned_value', { length: 255 }).notNull(),
    validationResult: varchar('validation_result', {
      length: 50,
      enum: ['pass', 'fail', 'alternate', 'manual', 'free_scan', 'error'],
    }).notNull(),
    feederSlot: varchar('feeder_slot', { length: 50 }),
    internalPartNumber: varchar('internal_part_number', { length: 100 }),
    matchedMPN: varchar('matched_mpn', { length: 100 }),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('scans_session_id_idx').on(table.sessionId),
    validationResultIdx: index('scans_validation_result_idx').on(table.validationResult),
  })
);

export const scanValidations = pgTable(
  'scan_validations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'restrict' }),
    stage: integer('stage').notNull(),
    passed: boolean('passed').notNull(),
    details: varchar('details', { length: 500 }),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
  },
  (table) => ({
    scanIdIdx: index('scan_validations_scan_id_idx').on(table.scanId),
    stageIdx: index('scan_validations_stage_idx').on(table.stage),
  })
);
