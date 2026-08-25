import { difficulties } from '../../questions/sampleQuestions.js'
import { customOnlyReadiness } from '../../../shared/customQuestionSchemas.js'
import { selectPrompts } from '../../questions/selectPrompts.js'
import { loadOfficialQuestions } from './repository.js'
import { localQuestionPools } from './localPools.js'
import { listActiveUserQuestions, normalizeSelectionMode } from './customPacks.js'
import { mapQuestionRow } from './rowMapper.js'

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

async function officialQuestionPoolForGame(gameType, settings = {}) {
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

async function userQuestionPoolForGame(gameType, settings = {}, context = {}) {
  if (!context.ownerUserId) return []
  const questionSetId =
    settings.contentSelectionMode === 'user_only' ? settings.preferredQuestionSetId : null
  const rows = await listActiveUserQuestions(
    { userId: context.ownerUserId },
    gameType,
    questionSetId,
  )
  return rows.map(mapQuestionRow).filter(Boolean)
}

async function questionPoolForGame(gameType, settings = {}, context = {}) {
  if (settings.accessMode === 'demo') return officialQuestionPoolForGame(gameType, settings)

  const selectionMode = normalizeSelectionMode(settings.contentSelectionMode)
  if (selectionMode === 'official' || !context.ownerUserId) {
    return officialQuestionPoolForGame(gameType, settings)
  }

  const userPool = await userQuestionPoolForGame(gameType, settings, context)
  if (selectionMode === 'mixed') {
    if (!userPool.length) {
      throw new Error('Mixed mode needs at least one active custom question for this game.')
    }
    const officialPool = await officialQuestionPoolForGame(gameType, settings)
    return [...officialPool, ...userPool]
  }

  const readiness = customOnlyReadiness(gameType, userPool)
  if (!readiness.ready) {
    throw new Error(
      gameType === 'million-ladder'
        ? `Custom-only Million Ladder needs active questions for rungs ${readiness.missingRungs.join(', ')}.`
        : `Custom-only needs ${readiness.minimumActiveQuestions} active questions for this game.`,
    )
  }
  return userPool
}

function selectOnePercentQuestions(pool, usedQuestionIds = new Set(), roundCount = 10) {
  const selectedDifficulties = difficulties.slice(0, roundCount)
  return selectedDifficulties.map((difficulty) => {
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

function selectMillionLadderQuestions(pool, usedQuestionIds = new Set(), roundCount = 15) {
  return Array.from({ length: roundCount }, (_, rung) =>
    selectMillionLadderForRung(pool, rung, usedQuestionIds),
  )
}

export async function selectQuestionsForGame(gameType, usedQuestionIds, settings = {}, context = {}) {
  const pool = await questionPoolForGame(gameType, settings, context)
  if (gameType === 'one-percent') return selectOnePercentQuestions(pool, usedQuestionIds, settings.roundCount)
  if (gameType === 'million-ladder') return selectMillionLadderQuestions(pool, usedQuestionIds, settings.roundCount)
  if (gameType === 'majority-rules') {
    return selectPrompts(pool, settings.roundCount || 8, usedQuestionIds)
  }
  if (gameType === 'bluff-battle') {
    return selectPrompts(pool, settings.roundCount || 6, usedQuestionIds)
  }
  if (gameType === 'survey-showdown') return selectPrompts(pool, settings.roundCount || 6, usedQuestionIds)
  if (gameType === 'say-what-you-see') {
    return selectPrompts(pool, settings.roundCount || 10, usedQuestionIds)
  }
  if (gameType === 'quickfire-30') return selectPrompts(pool, 64, usedQuestionIds)
  if (gameType === 'word-wheel') return selectPrompts(pool, 64, usedQuestionIds)
  return selectOnePercentQuestions(pool, usedQuestionIds)
}

export async function selectMillionLadderReplacementQuestion(
  rung,
  usedQuestionIds,
  excludedId,
  settings = {},
  context = {},
) {
  const pool = await questionPoolForGame('million-ladder', settings, context)
  return selectMillionLadderForRung(pool, rung, usedQuestionIds, excludedId)
}
