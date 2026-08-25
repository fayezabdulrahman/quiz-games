import crypto from 'node:crypto'
import { and, asc, eq, ne, sql } from 'drizzle-orm'
import {
  CONTENT_SELECTION_MODES,
  customOnlyReadiness,
  GAME_QUESTION_BUILDERS,
  validateCustomQuestion,
} from '../../../shared/customQuestionSchemas.js'
import { cleanupQuestionImages, mediaStorageKeys } from '../../storage/r2.js'
import { getDb, schema } from '../index.js'

const { questionSets, questions, userGameContentPreferences } = schema
const PACK_STATUSES = ['draft', 'active', 'archived']
const QUESTION_STATUSES = ['draft', 'active', 'archived']

function now() {
  return new Date()
}

function slugify(value) {
  const base = String(value || 'custom-pack')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return `${base || 'custom-pack'}-${crypto.randomUUID().slice(0, 8)}`
}

function cleanPackInput(input = {}) {
  return {
    title: String(input.title || '').trim().slice(0, 160),
    description: String(input.description || '').trim().slice(0, 500) || null,
    status: PACK_STATUSES.includes(input.status) ? input.status : 'draft',
  }
}

function packSelect() {
  return {
    id: questionSets.id,
    gameType: questionSets.gameType,
    slug: questionSets.slug,
    title: questionSets.title,
    description: questionSets.description,
    status: questionSets.status,
    settings: questionSets.settings,
    createdAt: questionSets.createdAt,
    updatedAt: questionSets.updatedAt,
  }
}

function questionSelect() {
  return {
    id: questions.id,
    questionSetId: questions.questionSetId,
    gameType: questions.gameType,
    externalId: questions.externalId,
    status: questions.status,
    questionKind: questions.questionKind,
    prompt: questions.prompt,
    answer: questions.answer,
    explanation: questions.explanation,
    difficulty: questions.difficulty,
    sortOrder: questions.sortOrder,
    payload: questions.payload,
    createdAt: questions.createdAt,
    updatedAt: questions.updatedAt,
  }
}

function questionMediaKeys(question) {
  return mediaStorageKeys(question?.payload?.media)
}

function removedMediaKeys(previousQuestion, nextPayload) {
  const nextKeys = new Set(mediaStorageKeys(nextPayload?.media))
  return questionMediaKeys(previousQuestion).filter((key) => !nextKeys.has(key))
}

export function isSupportedGame(gameType) {
  return Boolean(GAME_QUESTION_BUILDERS[gameType])
}

export function normalizeSelectionMode(selectionMode) {
  return CONTENT_SELECTION_MODES.includes(selectionMode) ? selectionMode : 'official'
}

function errorText(error) {
  return [error?.message, error?.cause?.message, error?.detail].filter(Boolean).join(' ')
}

function isGameTypeMigrationError(error) {
  return /game_type|question_sets|questions|user_game_content_preferences/i.test(errorText(error))
}

function officialOnlyContentOptions(gameType, reason) {
  return {
    gameType,
    customContentUnavailable: true,
    preference: { selectionMode: 'official', preferredQuestionSetId: null },
    packs: [],
    counts: { active: 0, draft: 0 },
    modes: {
      official: { enabled: true, reason: '' },
      mixed: { enabled: false, reason },
      user_only: { enabled: false, reason },
    },
    readiness: {
      ready: false,
      activeCount: 0,
      minimumActiveQuestions: GAME_QUESTION_BUILDERS[gameType]?.minimumActiveQuestions || 1,
      missingRungs: [],
    },
  }
}

function customContentShortfallReason(gameType, readiness) {
  const remaining = Math.max(0, readiness.minimumActiveQuestions - readiness.activeCount)
  if (gameType === 'million-ladder') {
    return `Add active questions for rungs ${readiness.missingRungs.join(', ')}.`
  }
  if (gameType === 'word-wheel') {
    return `Add ${remaining} more active category prompts.`
  }
  return `Add ${remaining} more active questions.`
}

export async function getUserPack(access, packId) {
  const [pack] = await getDb()
    .select(packSelect())
    .from(questionSets)
    .where(
      and(
        eq(questionSets.id, packId),
        eq(questionSets.source, 'user'),
        eq(questionSets.ownerUserId, access.userId),
      ),
    )
  return pack || null
}

export async function getUserPackWithQuestions(access, packId) {
  const pack = await getUserPack(access, packId)
  if (!pack) return null
  const packQuestions = await getDb()
    .select(questionSelect())
    .from(questions)
    .where(
      and(
        eq(questions.questionSetId, pack.id),
        eq(questions.source, 'user'),
        eq(questions.ownerUserId, access.userId),
        ne(questions.status, 'archived'),
      ),
    )
    .orderBy(asc(questions.sortOrder), asc(questions.createdAt))
  return { ...pack, questions: packQuestions }
}

async function countQuestionsForPack(packId) {
  const rows = await getDb()
    .select({
      status: questions.status,
      count: sql`count(*)`.mapWith(Number),
    })
    .from(questions)
    .where(eq(questions.questionSetId, packId))
    .groupBy(questions.status)
  return Object.fromEntries(rows.map((row) => [row.status, row.count]))
}

export async function listUserPacks(access, gameType) {
  const filters = [
    eq(questionSets.source, 'user'),
    eq(questionSets.ownerUserId, access.userId),
    ne(questionSets.status, 'archived'),
  ]
  if (gameType) filters.push(eq(questionSets.gameType, gameType))

  const packs = await getDb()
    .select(packSelect())
    .from(questionSets)
    .where(and(...filters))
    .orderBy(asc(questionSets.gameType), asc(questionSets.title))

  return Promise.all(
    packs.map(async (pack) => {
      const counts = await countQuestionsForPack(pack.id)
      return {
        ...pack,
        counts: {
          draft: counts.draft || 0,
          active: counts.active || 0,
          archived: counts.archived || 0,
        },
      }
    }),
  )
}

export async function createUserPack(access, input = {}) {
  if (!isSupportedGame(input.gameType)) {
    return { ok: false, status: 400, error: 'Choose a supported game.' }
  }
  const values = cleanPackInput(input)
  if (!values.title) return { ok: false, status: 400, error: 'Name the pack before saving.' }

  const [pack] = await getDb()
    .insert(questionSets)
    .values({
      source: 'user',
      ownerUserId: access.userId,
      ownerClerkUserId: access.clerkUserId,
      gameType: input.gameType,
      slug: slugify(values.title),
      title: values.title,
      description: values.description,
      status: values.status,
      settings: {},
    })
    .returning(packSelect())

  return { ok: true, pack: { ...pack, counts: { draft: 0, active: 0, archived: 0 } } }
}

export async function updateUserPack(access, packId, input = {}) {
  const pack = await getUserPack(access, packId)
  if (!pack) return { ok: false, status: 404, error: 'Pack not found.' }

  const values = cleanPackInput({
    title: input.title ?? pack.title,
    description: input.description ?? pack.description,
    status: input.status ?? pack.status,
  })
  if (!values.title) return { ok: false, status: 400, error: 'Name the pack before saving.' }

  const [updated] = await getDb()
    .update(questionSets)
    .set({
      title: values.title,
      description: values.description,
      status: values.status,
      updatedAt: now(),
    })
    .where(eq(questionSets.id, pack.id))
    .returning(packSelect())

  return { ok: true, pack: updated }
}

export async function deleteUserPack(access, packId) {
  const pack = await getUserPack(access, packId)
  if (!pack) return { ok: false, status: 404, error: 'Pack not found.' }
  const packQuestions = await getDb()
    .select({ payload: questions.payload })
    .from(questions)
    .where(and(eq(questions.questionSetId, pack.id), eq(questions.ownerUserId, access.userId)))
  const storageKeys = packQuestions.flatMap(questionMediaKeys)

  await getDb()
    .update(userGameContentPreferences)
    .set({
      selectionMode: 'official',
      preferredQuestionSetId: null,
      preferredQuestionSetGameType: null,
      updatedAt: now(),
    })
    .where(eq(userGameContentPreferences.preferredQuestionSetId, pack.id))

  const [deleted] = await getDb()
    .delete(questionSets)
    .where(eq(questionSets.id, pack.id))
    .returning({ id: questionSets.id })

  if (!deleted) return { ok: false, status: 404, error: 'Pack not found.' }
  await cleanupQuestionImages(access, storageKeys)
  return { ok: true }
}

export async function upsertUserQuestion(access, packId, input = {}, questionId = null) {
  const pack = await getUserPack(access, packId)
  if (!pack || pack.status === 'archived') {
    return { ok: false, status: 404, error: 'Pack not found.' }
  }

  const validation = validateCustomQuestion(pack.gameType, input.form || input)
  const status = QUESTION_STATUSES.includes(input.status) ? input.status : 'draft'
  if (status === 'active' && validation.errors.length) {
    return {
      ok: false,
      status: 400,
      error: validation.errors[0].message,
      errors: validation.errors,
      warnings: validation.warnings,
    }
  }

  const questionValues = {
    questionSetId: pack.id,
    source: 'user',
    ownerUserId: access.userId,
    ownerClerkUserId: access.clerkUserId,
    gameType: pack.gameType,
    status,
    questionKind: validation.row.questionKind,
    schemaVersion: 1,
    prompt: validation.row.prompt,
    answer: validation.row.answer,
    explanation: validation.row.explanation,
    difficulty: validation.row.difficulty,
    sortOrder: Number.isInteger(input.sortOrder) ? input.sortOrder : 0,
    payload: {
      ...validation.row.payload,
      completion: {
        isComplete: validation.isComplete,
        errors: validation.errors,
      },
    },
    updatedAt: now(),
  }

  if (questionId) {
    const [existing] = await getDb()
      .select({ id: questions.id, payload: questions.payload })
      .from(questions)
      .where(
        and(
          eq(questions.id, questionId),
          eq(questions.questionSetId, pack.id),
          eq(questions.ownerUserId, access.userId),
        ),
      )
    if (!existing) return { ok: false, status: 404, error: 'Question not found.' }
    const keysToDelete = removedMediaKeys(existing, questionValues.payload)

    const [updated] = await getDb()
      .update(questions)
      .set(questionValues)
      .where(eq(questions.id, existing.id))
      .returning(questionSelect())
    await cleanupQuestionImages(access, keysToDelete)
    return { ok: true, question: updated, warnings: validation.warnings }
  }

  const [created] = await getDb()
    .insert(questions)
    .values({
      ...questionValues,
      externalId: `user-${crypto.randomUUID()}`,
    })
    .returning(questionSelect())
  return { ok: true, question: created, warnings: validation.warnings }
}

export async function deleteUserQuestion(access, packId, questionId) {
  const pack = await getUserPack(access, packId)
  if (!pack) return { ok: false, status: 404, error: 'Pack not found.' }

  const [existing] = await getDb()
    .select({ payload: questions.payload })
    .from(questions)
    .where(
      and(
        eq(questions.id, questionId),
        eq(questions.questionSetId, pack.id),
        eq(questions.ownerUserId, access.userId),
      ),
    )
  const storageKeys = questionMediaKeys(existing)

  const [deleted] = await getDb()
    .delete(questions)
    .where(
      and(
        eq(questions.id, questionId),
        eq(questions.questionSetId, pack.id),
        eq(questions.ownerUserId, access.userId),
      ),
    )
    .returning({ id: questions.id })

  if (!deleted) return { ok: false, status: 404, error: 'Question not found.' }
  await cleanupQuestionImages(access, storageKeys)
  return { ok: true }
}

export async function listActiveUserQuestions(access, gameType, questionSetId = null) {
  const filters = [
    eq(questions.source, 'user'),
    eq(questions.ownerUserId, access.userId),
    eq(questions.gameType, gameType),
    eq(questions.status, 'active'),
  ]
  if (questionSetId) filters.push(eq(questions.questionSetId, questionSetId))

  return getDb()
    .select(questionSelect())
    .from(questions)
    .innerJoin(questionSets, eq(questions.questionSetId, questionSets.id))
    .where(and(...filters, eq(questionSets.status, 'active')))
    .orderBy(asc(questions.sortOrder), asc(questions.createdAt))
}

export async function getContentPreference(access, gameType) {
  const [preference] = await getDb()
    .select({
      selectionMode: userGameContentPreferences.selectionMode,
      preferredQuestionSetId: userGameContentPreferences.preferredQuestionSetId,
    })
    .from(userGameContentPreferences)
    .where(
      and(
        eq(userGameContentPreferences.userId, access.userId),
        eq(userGameContentPreferences.gameType, gameType),
      ),
    )
  return preference || { selectionMode: 'official', preferredQuestionSetId: null }
}

export async function contentOptionsForGame(access, gameType) {
  if (!isSupportedGame(gameType)) return null
  let packs = []
  let activeQuestions = []
  let preference = { selectionMode: 'official', preferredQuestionSetId: null }
  try {
    packs = await listUserPacks(access, gameType)
    activeQuestions = await listActiveUserQuestions(access, gameType)
    preference = await getContentPreference(access, gameType)
  } catch (error) {
    if (!isGameTypeMigrationError(error)) throw error
    console.warn('[content] Custom content unavailable for this game.', error?.message || error)
    return officialOnlyContentOptions(
      gameType,
      'Custom packs are unavailable until the latest database migration has been applied.',
    )
  }
  const readiness = customOnlyReadiness(gameType, activeQuestions)
  return {
    gameType,
    preference,
    packs,
    counts: {
      active: activeQuestions.length,
      draft: packs.reduce((sum, pack) => sum + pack.counts.draft, 0),
    },
    modes: {
      official: { enabled: true, reason: '' },
      mixed: {
        enabled: activeQuestions.length > 0,
        reason: activeQuestions.length > 0 ? '' : 'Add a custom question pack to mix it in.',
      },
      user_only: {
        enabled: readiness.ready,
        reason: readiness.ready ? '' : customContentShortfallReason(gameType, readiness),
      },
    },
    readiness,
  }
}

export async function saveContentPreference(access, gameType, input = {}) {
  if (!isSupportedGame(gameType)) {
    return { ok: false, status: 400, error: 'Choose a supported game.' }
  }
  const selectionMode = normalizeSelectionMode(input.selectionMode)
  let preferredQuestionSetId = input.preferredQuestionSetId || null

  if (preferredQuestionSetId) {
    const pack = await getUserPack(access, preferredQuestionSetId)
    if (!pack || pack.gameType !== gameType || pack.status === 'archived') {
      return { ok: false, status: 400, error: 'Choose one of your packs for this game.' }
    }
  }
  if (selectionMode !== 'user_only') preferredQuestionSetId = null

  const options = await contentOptionsForGame(access, gameType)
  if (options.customContentUnavailable && selectionMode === 'official') {
    return { ok: true, preference: options.preference }
  }
  if (!options.modes[selectionMode]?.enabled) {
    return {
      ok: false,
      status: 400,
      error: options.modes[selectionMode]?.reason || 'That content mode is not available yet.',
    }
  }

  const [preference] = await getDb()
    .insert(userGameContentPreferences)
    .values({
      userId: access.userId,
      clerkUserId: access.clerkUserId,
      gameType,
      selectionMode,
      preferredQuestionSetId,
      preferredQuestionSetGameType: preferredQuestionSetId ? gameType : null,
    })
    .onConflictDoUpdate({
      target: [userGameContentPreferences.userId, userGameContentPreferences.gameType],
      set: {
        selectionMode,
        preferredQuestionSetId,
        preferredQuestionSetGameType: preferredQuestionSetId ? gameType : null,
        updatedAt: now(),
      },
    })
    .returning({
      selectionMode: userGameContentPreferences.selectionMode,
      preferredQuestionSetId: userGameContentPreferences.preferredQuestionSetId,
    })

  return { ok: true, preference }
}
