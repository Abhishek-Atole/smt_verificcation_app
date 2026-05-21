import { pgTable, uuid, varchar, integer, timestamp, doublePrecision, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const analytics = pgTable(
  'analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: varchar('date', { length: 10 }).notNull(),
    hour: integer('hour').notNull(),
    sessionCount: integer('session_count').notNull(),
    scanCount: integer('scan_count').notNull(),
    passCount: integer('pass_count').notNull(),
    failCount: integer('fail_count').notNull(),
    averageSessionDuration: doublePrecision('average_session_duration').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    dateIdx: index('analytics_date_idx').on(table.date),
    hourIdx: index('analytics_hour_idx').on(table.hour),
  })
);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportType: varchar('report_type', { length: 50, enum: ['daily', 'weekly', 'monthly', 'custom'] }).notNull(),
    generatedBy: uuid('generated_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    startDate: varchar('start_date', { length: 10 }).notNull(),
    endDate: varchar('end_date', { length: 10 }).notNull(),
    summary: varchar('summary', { length: 1000 }),
    filePath: varchar('file_path', { length: 500 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    reportTypeIdx: index('reports_report_type_idx').on(table.reportType),
    generatedByIdx: index('reports_generated_by_idx').on(table.generatedBy),
  })
);

export const exportJobs = pgTable(
  'export_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    exportType: varchar('export_type', { length: 50, enum: ['csv', 'excel', 'pdf', 'json'] }).notNull(),
    status: varchar('status', { length: 50, enum: ['pending', 'processing', 'completed', 'failed'] }).notNull(),
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    filePath: varchar('file_path', { length: 500 }),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    exportTypeIdx: index('export_jobs_export_type_idx').on(table.exportType),
    statusIdx: index('export_jobs_status_idx').on(table.status),
    requestedByIdx: index('export_jobs_requested_by_idx').on(table.requestedBy),
  })
);
