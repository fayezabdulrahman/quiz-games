import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { gameTypeEnum } from './enums.js'
import { users } from './users.js'

export const wordDictionaryEntries = pgTable(
  'word_dictionary_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    word: varchar('word', { length: 120 }).notNull(),
    normalizedWord: varchar('normalized_word', { length: 120 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('approved'),
    source: varchar('source', { length: 32 }).notNull().default('host_accepted'),
    acceptedByUserId: uuid('accepted_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    acceptedByClerkUserId: varchar('accepted_by_clerk_user_id', { length: 191 }),
    firstSeenGameType: gameTypeEnum('first_seen_game_type'),
    timesAccepted: integer('times_accepted').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    normalizedWordIdx: uniqueIndex('word_dictionary_entries_normalized_word_idx').on(
      table.normalizedWord,
    ),
    statusIdx: index('word_dictionary_entries_status_idx').on(table.status),
    sourceIdx: index('word_dictionary_entries_source_idx').on(table.source),
    firstSeenGameTypeIdx: index('word_dictionary_entries_first_seen_game_type_idx').on(
      table.firstSeenGameType,
    ),
    acceptedByUserIdx: index('word_dictionary_entries_accepted_by_user_idx').on(
      table.acceptedByUserId,
    ),
    statusCheck: check(
      'word_dictionary_entries_status_check',
      sql`${table.status} in ('pending', 'approved', 'rejected')`,
    ),
    sourceCheck: check(
      'word_dictionary_entries_source_check',
      sql`${table.source} in ('seed', 'host_accepted')`,
    ),
    timesAcceptedCheck: check(
      'word_dictionary_entries_times_accepted_check',
      sql`${table.timesAccepted} >= 0`,
    ),
  }),
)
