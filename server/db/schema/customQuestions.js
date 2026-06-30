import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import {
  contentSelectionModeEnum,
  gameTypeEnum,
  questionSetStatusEnum,
  questionSourceEnum,
  questionStatusEnum,
} from './enums.js'
import { users } from './users.js'

export const questionSets = pgTable(
  'question_sets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    source: questionSourceEnum('source').notNull().default('user'),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'cascade' }),
    ownerClerkUserId: varchar('owner_clerk_user_id', { length: 191 }),
    gameType: gameTypeEnum('game_type').notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    title: varchar('title', { length: 160 }).notNull(),
    description: text('description'),
    status: questionSetStatusEnum('status').notNull().default('draft'),
    isDefaultForGame: boolean('is_default_for_game').notNull().default(false),
    settings: jsonb('settings').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    idGameTypeUnique: unique('question_sets_id_game_type_unique').on(
      table.id,
      table.gameType
    ),
    sourceGameIdx: index('question_sets_source_game_idx').on(table.source, table.gameType),
    sourceGameSlugIdx: unique('question_sets_source_game_slug_unique').on(
      table.source,
      table.gameType,
      table.slug
    ),
    ownerGameIdx: index('question_sets_owner_game_idx').on(
      table.ownerUserId,
      table.gameType
    ),
    ownerClerkUserIdIdx: index('question_sets_owner_clerk_user_id_idx').on(
      table.ownerClerkUserId
    ),
    statusIdx: index('question_sets_status_idx').on(table.status),
    userSourceOwnerCheck: check(
      'question_sets_user_source_owner_check',
      sql`${table.source} = 'official' OR ${table.ownerUserId} IS NOT NULL`
    ),
  })
)

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    questionSetId: uuid('question_set_id')
      .notNull()
      .references(() => questionSets.id, { onDelete: 'cascade' }),
    source: questionSourceEnum('source').notNull().default('user'),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'cascade' }),
    ownerClerkUserId: varchar('owner_clerk_user_id', { length: 191 }),
    gameType: gameTypeEnum('game_type').notNull(),
    externalId: varchar('external_id', { length: 160 }),
    status: questionStatusEnum('status').notNull().default('draft'),
    questionKind: varchar('question_kind', { length: 80 }).notNull(),
    schemaVersion: integer('schema_version').notNull().default(1),
    prompt: text('prompt'),
    answer: text('answer'),
    explanation: text('explanation'),
    difficulty: integer('difficulty'),
    sortOrder: integer('sort_order').notNull().default(0),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    questionSetIdx: index('questions_question_set_idx').on(table.questionSetId),
    questionSetExternalIdIdx: unique('questions_question_set_external_id_unique').on(
      table.questionSetId,
      table.externalId
    ),
    sourceGameIdx: index('questions_source_game_idx').on(table.source, table.gameType),
    ownerGameIdx: index('questions_owner_game_idx').on(table.ownerUserId, table.gameType),
    ownerClerkUserIdIdx: index('questions_owner_clerk_user_id_idx').on(
      table.ownerClerkUserId
    ),
    statusIdx: index('questions_status_idx').on(table.status),
    questionKindIdx: index('questions_question_kind_idx').on(table.questionKind),
    setGameFk: foreignKey({
      name: 'questions_question_set_game_type_fk',
      columns: [table.questionSetId, table.gameType],
      foreignColumns: [questionSets.id, questionSets.gameType],
    }).onDelete('cascade'),
    userSourceOwnerCheck: check(
      'questions_user_source_owner_check',
      sql`${table.source} = 'official' OR ${table.ownerUserId} IS NOT NULL`
    ),
    schemaVersionCheck: check('questions_schema_version_check', sql`${table.schemaVersion} >= 1`),
    difficultyCheck: check(
      'questions_difficulty_check',
      sql`${table.difficulty} IS NULL OR ${table.difficulty} BETWEEN 1 AND 100`
    ),
  })
)

export const userGameContentPreferences = pgTable(
  'user_game_content_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clerkUserId: varchar('clerk_user_id', { length: 191 }).notNull(),
    gameType: gameTypeEnum('game_type').notNull(),
    selectionMode: contentSelectionModeEnum('selection_mode').notNull().default('official'),
    preferredQuestionSetId: uuid('preferred_question_set_id'),
    preferredQuestionSetGameType: gameTypeEnum('preferred_question_set_game_type'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userGameUnique: unique('user_game_content_preferences_user_game_unique').on(
      table.userId,
      table.gameType
    ),
    clerkUserIdIdx: index('user_game_content_preferences_clerk_user_id_idx').on(
      table.clerkUserId
    ),
    selectionModeIdx: index('user_game_content_preferences_selection_mode_idx').on(
      table.selectionMode
    ),
    preferredSetGameFk: foreignKey({
      name: 'user_game_content_preferences_set_game_type_fk',
      columns: [table.preferredQuestionSetId, table.preferredQuestionSetGameType],
      foreignColumns: [questionSets.id, questionSets.gameType],
    }).onDelete('set null'),
    preferredSetGameCheck: check(
      'user_game_content_preferences_set_game_check',
      sql`${table.preferredQuestionSetId} IS NULL OR ${table.preferredQuestionSetGameType} = ${table.gameType}`
    ),
  })
)
