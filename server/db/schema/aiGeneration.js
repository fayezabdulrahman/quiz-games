import { date, integer, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const aiQuestionUsage = pgTable(
  'ai_question_usage',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    usageDate: date('usage_date').notNull(),
    generationCount: integer('generation_count').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.usageDate] }),
  }),
)
