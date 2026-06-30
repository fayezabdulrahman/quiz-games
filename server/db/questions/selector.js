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

async function questionPoolForGame(gameType) {
  try {
    const dbQuestions = await loadOfficialQuestions(gameType)
    if (dbQuestions.length) return dbQuestions
    warnOnce(gameType, new Error('No active official questions found in the database.'))
  } catch (error) {
    warnOnce(gameType, error)
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
  const pool = await questionPoolForGame(gameType)
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

export async function selectMillionLadderReplacementQuestion(rung, usedQuestionIds, excludedId) {
  const pool = await questionPoolForGame('million-ladder')
  return selectMillionLadderForRung(pool, rung, usedQuestionIds, excludedId)
}
