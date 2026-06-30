import { pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkUserId: varchar('clerk_user_id', { length: 191 }).notNull(),
    email: varchar('email', { length: 320 }),
    displayName: varchar('display_name', { length: 160 }),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    clerkUserIdIdx: uniqueIndex('users_clerk_user_id_idx').on(table.clerkUserId),
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
  })
)
