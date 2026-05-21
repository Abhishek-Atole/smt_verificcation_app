import { pgTable, uuid, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const adminSettings = pgTable(
  'admin_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    settingKey: varchar('setting_key', { length: 100 }).notNull().unique(),
    settingValue: varchar('setting_value', { length: 1000 }).notNull(),
    description: varchar('description', { length: 500 }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    settingKeyIdx: index('admin_settings_setting_key_idx').on(table.settingKey),
  })
);

export const ipAllowlist = pgTable(
  'ip_allowlist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ipAddress: varchar('ip_address', { length: 64 }).notNull().unique(),
    description: varchar('description', { length: 500 }),
    isActive: boolean('is_active').notNull().default(true),
    addedBy: uuid('added_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    ipAddressIdx: index('ip_allowlist_ip_address_idx').on(table.ipAddress),
    isActiveIdx: index('ip_allowlist_is_active_idx').on(table.isActive),
  })
);
