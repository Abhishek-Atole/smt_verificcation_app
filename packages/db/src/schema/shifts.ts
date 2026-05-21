import { pgTable, uuid, varchar, integer, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const shifts = pgTable(
  'shifts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    startTime: varchar('start_time', { length: 5 }).notNull(),
    endTime: varchar('end_time', { length: 5 }).notNull(),
    supervisor: uuid('supervisor')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    maxOperators: integer('max_operators').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index('shifts_name_idx').on(table.name),
    supervisorIdx: index('shifts_supervisor_idx').on(table.supervisor),
  })
);

export const performanceMetrics = pgTable(
  'performance_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: varchar('date', { length: 10 }).notNull(),
    firstPassYield: varchar('first_pass_yield', { length: 10 }).notNull(),
    feedersPerMinute: varchar('feeders_per_minute', { length: 10 }).notNull(),
    averageCycleTime: varchar('average_cycle_time', { length: 10 }).notNull(),
    oeeScore: varchar('oee_score', { length: 10 }).notNull(),
    availability: varchar('availability', { length: 10 }).notNull(),
    performance: varchar('performance', { length: 10 }).notNull(),
    quality: varchar('quality', { length: 10 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    dateIdx: index('performance_metrics_date_idx').on(table.date),
  })
);
