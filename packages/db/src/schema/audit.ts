import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    action: varchar('action', {
      length: 100,
      enum: [
        'CREATE_BOM',
        'UPDATE_BOM',
        'DELETE_BOM',
        'CREATE_SESSION',
        'UPDATE_SESSION',
        'CREATE_USER',
        'UPDATE_USER',
        'DELETE_USER',
      ],
    }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 255 }).notNull(),
    oldValues: text('old_values'),
    newValues: text('new_values'),
    ipAddress: varchar('ip_address', { length: 64 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    entityTypeIdx: index('audit_logs_entity_type_idx').on(table.entityType),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  })
);

export const systemLogs = pgTable(
  'system_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    level: varchar('level', { length: 50, enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'] }).notNull(),
    message: varchar('message', { length: 500 }).notNull(),
    context: text('context'),
    stackTrace: text('stack_trace'),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
  },
  (table) => ({
    levelIdx: index('system_logs_level_idx').on(table.level),
    timestampIdx: index('system_logs_timestamp_idx').on(table.timestamp),
  })
);
