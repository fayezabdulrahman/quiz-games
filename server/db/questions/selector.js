import { difficulties } from '../../questions/onePercent/index.js'
import { selectPrompts } from '../../questions/selectPrompts.js'
import { loadOfficialQuestions } from './repository.js'
import { localQuestionPools } from './localPools.js'

const fallbackWarnings = new Set()

function warnOnce(gameType, error) {
  if (fallbackWarnings.has(gameType)) return
  fallbackWarnings.add(gameType)
  const reason = error?.message ? ` ${error.message}` : ''
  console.warn(`[questions] Using local ${gameType} questions.${reason}`)
}

const demoQuestionSetSlugs = {
  'majority-rules': 'majority-rules-demo-v1',
  'million-ladder': 'million-ladder-demo-v1',
}

function localDemoPool(gameType) {
  const pool = localQuestionPools[gameType] || []
  if (gameType === 'majority-rules') return structuredClone(pool.slice(0, 8))
  if (gameType === 'million-ladder') {
    return structuredClone(
      Array.from({ length: 15 }, (_, rung) => pool.find((question) => question.rung === rung)).filter(Boolean),
    )
  }
  return []
}

async function questionPoolForGame(gameType, settings = {}) {
  const questionSetSlug = settings.accessMode === 'demo' ? demoQuestionSetSlugs[gameType] : null

  try {
    const dbQuestions = await loadOfficialQuestions(gameType, { questionSetSlug })
    if (dbQuestions.length) return dbQuestions
    warnOnce(
      questionSetSlug || gameType,
      new Error(
        questionSetSlug
          ? `No active official ${questionSetSlug} questions found in the database.`
          : 'No active official questions found in the database.',
      ),
    )
  } catch (error) {
    warnOnce(questionSetSlug || gameType, error)
  }
  if (settings.accessMode === 'demo') {
    return localDemoPool(gameType)
  }
  return structuredClone(localQuestionPools[gameType] || localQuestionPools['one-percent'])
}

function selectOnePercentQuestions(pool, usedQuestionIds = new Set()) {
  return difficulties.map((difficulty) => {
    const unusedQuestions = pool.filter(
      (question) => question.difficulty === difficulty && !usedQuestionIds.has(question.id),
    )
    const candidates =
      unusedQuestions.length > 0
        ? unusedQuestions
        : pool.filter((question) => question.difficulty === difficulty)
    const selected = candidates[Math.floor(Math.random() * candidates.length)]

    usedQuestionIds.add(selected.id)
    return structuredClone(selected)
  })
}

function questionsForRung(pool, rung) {
  return pool.filter((question) => question.rung === rung)
}

function selectMillionLadderForRung(pool, rung, usedQuestionIds, excludedId) {
  const rungQuestions = questionsForRung(pool, rung)
  let available = rungQuestions.filter(
    (question) => question.id !== excludedId && !usedQuestionIds.has(question.id),
  )
  if (!available.length) {
    rungQuestions.forEach((question) => {
      usedQuestionIds.delete(question.id)
    })
    available = rungQuestions.filter((question) => question.id !== excludedId)
  }
  if (!available.length) available = rungQuestions
  const selected = available[Math.floor(Math.random() * available.length)]
  usedQuestionIds.add(selected.id)
  return structuredClone(selected)
}

function selectMillionLadderQuestions(pool, usedQuestionIds = new Set()) {
  return Array.from({ length: 15 }, (_, rung) =>
    selectMillionLadderForRung(pool, rung, usedQuestionIds),
  )
}

export async function selectQuestionsForGame(gameType, usedQuestionIds, settings = {}) {
  const pool = await questionPoolForGame(gameType, settings)
  if (settings.accessMode === 'demo') return structuredClone(pool)
  if (gameType === 'one-percent') return selectOnePercentQuestions(pool, usedQuestionIds)
  if (gameType === 'million-ladder') return selectMillionLadderQuestions(pool, usedQuestionIds)
  if (gameType === 'majority-rules') {
    return selectPrompts(pool, settings.roundCount || 8, usedQuestionIds)
  }
  if (gameType === 'bluff-battle') {
    return selectPrompts(pool, settings.roundCount || 6, usedQuestionIds)
  }
  if (gameType === 'survey-showdown') return selectPrompts(pool, 6, usedQuestionIds)
  if (gameType === 'say-what-you-see') {
    return selectPrompts(pool, settings.roundCount || 10, usedQuestionIds)
  }
  if (gameType === 'quickfire-30') return selectPrompts(pool, 64, usedQuestionIds)
  return selectOnePercentQuestions(pool, usedQuestionIds)
}

export async function selectMillionLadderReplacementQuestion(
  rung,
  usedQuestionIds,
  excludedId,
  settings = {},
) {
  const pool = await questionPoolForGame('million-ladder', settings)
  return selectMillionLadderForRung(pool, rung, usedQuestionIds, excludedId)
}
