import { and, asc, eq } from 'drizzle-orm'
import { getDb, schema } from '../index.js'
import { mapQuestionRow } from './rowMapper.js'

const { questions } = schema

const DEFAULT_CACHE_MS = 60_000
const cache = new Map()

function cacheMs() {
  const parsed = Number.parseInt(process.env.QUESTION_DB_CACHE_MS || '', 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_CACHE_MS
}

function isFresh(entry) {
  return entry && Date.now() - entry.loadedAt < cacheMs()
}

export function clearOfficialQuestionCache(gameType) {
  if (gameType) cache.delete(gameType)
  else cache.clear()
}

export async function loadOfficialQuestions(gameType) {
  if (!process.env.DATABASE_URL) return []

  const cached = cache.get(gameType)
  if (isFresh(cached)) return structuredClone(cached.questions)

  const rows = await getDb()
    .select({
      id: questions.id,
      gameType: questions.gameType,
      externalId: questions.externalId,
      questionKind: questions.questionKind,
      prompt: questions.prompt,
      answer: questions.answer,
      explanation: questions.explanation,
      difficulty: questions.difficulty,
      sortOrder: questions.sortOrder,
      payload: questions.payload,
    })
    .from(questions)
    .where(
      and(
        eq(questions.source, 'official'),
        eq(questions.status, 'active'),
        eq(questions.gameType, gameType),
      ),
    )
    .orderBy(asc(questions.sortOrder), asc(questions.externalId))

  const mappedQuestions = rows.map(mapQuestionRow).filter(Boolean)
  cache.set(gameType, {
    loadedAt: Date.now(),
    questions: mappedQuestions,
  })
  return structuredClone(mappedQuestions)
}
