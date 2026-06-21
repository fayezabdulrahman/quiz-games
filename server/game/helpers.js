import crypto from 'node:crypto'
import { selectBluffPrompts } from '../questions/bluffBattle/index.js'
import { selectMajorityPrompts } from '../questions/commonAnswer/index.js'
import { selectQuestions } from '../questions/onePercent/index.js'

export function normalize(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[.,!?'"-]/g, '')
    .replace(/\s+/g, ' ')
}

export function correctAnswer(question, submitted) {
  const answers =
    question.acceptedOverride || (Array.isArray(question.answer) ? question.answer : [question.answer])
  return answers.some((answer) => normalize(answer) === normalize(submitted))
}

export function normalizeLifelineCount(value) {
  const count = Number.parseInt(value, 10)
  return Number.isFinite(count) ? Math.min(Math.max(count, 0), 10) : 1
}

export function settingsForGame(gameType, settings = {}) {
  if (gameType === 'majority-rules') return { roundCount: 8 }
  if (gameType === 'bluff-battle') return { roundCount: 5 }
  return {
    lifelineCount: normalizeLifelineCount(settings.lifelineCount),
    lifelinesAnytime: Boolean(settings.lifelinesAnytime),
  }
}

export function questionsForGame(gameType, usedQuestionIds) {
  if (gameType === 'majority-rules') return selectMajorityPrompts(8, usedQuestionIds)
  if (gameType === 'bluff-battle') return selectBluffPrompts(5, usedQuestionIds)
  return selectQuestions(usedQuestionIds)
}

export function resetPlayer(player, settings, resetScore = false) {
  player.active = true
  player.hasAnswered = false
  player.answer = null
  player.isCorrect = null
  player.passedCurrentQuestion = false
  player.lifelinesRemaining = settings.lifelineCount || 0
  player.roundPoints = 0
  player.bluff = null
  player.voteOptionId = null
  player.fooledCount = 0
  if (resetScore) player.score = 0
}

export function resetPlayerForNextQuestion(player) {
  player.hasAnswered = false
  player.answer = null
  player.isCorrect = null
  player.passedCurrentQuestion = false
  player.roundPoints = 0
  player.bluff = null
  player.voteOptionId = null
  player.fooledCount = 0
}

export function createPlayer(socketId, name, settings) {
  const player = {
    id: crypto.randomUUID(),
    socketId,
    name,
    connected: true,
    score: 0,
  }
  resetPlayer(player, settings)
  return player
}
