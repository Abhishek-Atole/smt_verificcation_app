import { pgTable, uuid, varchar, boolean, timestamp, integer, index } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 50, enum: ['admin', 'supervisor', 'qa', 'operator'] }).notNull(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    version: integer('version').notNull().default(0),
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
    isDeletedIdx: index('users_is_deleted_idx').on(table.isDeleted),
  })
);

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    token: varchar('token', { length: 500 }).notNull(),
    ipHash: varchar('ip_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('user_sessions_expires_at_idx').on(table.expiresAt),
  })
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    message: varchar('message', { length: 500 }).notNull(),
    type: varchar('type', { length: 50, enum: ['info', 'warning', 'error', 'success'] }).notNull(),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  })
);
