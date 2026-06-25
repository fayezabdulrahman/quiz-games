import crypto from 'node:crypto'
import { selectBluffPrompts } from '../questions/bluffBattle/index.js'
import { selectMajorityPrompts } from '../questions/commonAnswer/index.js'
import { selectMillionLadderQuestions } from '../questions/millionLadder/index.js'
import { selectQuestions } from '../questions/onePercent/index.js'
import { selectQuickfire30Cards } from '../questions/quickfire30/index.js'
import { selectSayWhatYouSeePuzzles } from '../questions/sayWhatYouSee/index.js'
import { selectSurveyShowdownPrompts } from '../questions/surveyShowdown/index.js'

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

export function normalizeBluffRoundCount(value) {
  const count = Number.parseInt(value, 10)
  return Number.isFinite(count) ? Math.min(Math.max(count, 3), 20) : 6
}

export function normalizeSayWhatYouSeeRoundCount(value) {
  const count = Number.parseInt(value, 10)
  return Number.isFinite(count) ? Math.min(Math.max(count, 3), 20) : 10
}

export function normalizeMajorityRoundCount(value) {
  const count = Number.parseInt(value, 10)
  return Number.isFinite(count) ? Math.min(Math.max(count, 3), 20) : 8
}

export function normalizeCatchphraseGuessSeconds(value) {
  const seconds = Number.parseInt(value, 10)
  return Number.isFinite(seconds) ? Math.min(Math.max(seconds, 5), 30) : 10
}

export function settingsForGame(gameType, settings = {}) {
  if (gameType === 'majority-rules') return { roundCount: normalizeMajorityRoundCount(settings.roundCount) }
  if (gameType === 'bluff-battle') return { roundCount: normalizeBluffRoundCount(settings.roundCount) }
  if (gameType === 'million-ladder') return { roundCount: 15 }
  if (gameType === 'survey-showdown') return { roundCount: 6 }
  if (gameType === 'say-what-you-see') {
    return {
      roundCount: normalizeSayWhatYouSeeRoundCount(settings.roundCount),
      guessTimerEnabled: Boolean(settings.guessTimerEnabled),
      guessSeconds: normalizeCatchphraseGuessSeconds(settings.guessSeconds),
    }
  }
  if (gameType === 'quickfire-30') {
    return {
      diceMode: settings.diceMode === 'manual' ? 'manual' : 'digital',
      boardLength: 30,
    }
  }
  return {
    lifelineCount: normalizeLifelineCount(settings.lifelineCount),
    lifelinesAnytime: Boolean(settings.lifelinesAnytime),
  }
}

export function questionsForGame(gameType, usedQuestionIds, settings = {}) {
  if (gameType === 'majority-rules') return selectMajorityPrompts(settings.roundCount || 8, usedQuestionIds)
  if (gameType === 'bluff-battle') return selectBluffPrompts(settings.roundCount || 6, usedQuestionIds)
  if (gameType === 'million-ladder') return selectMillionLadderQuestions(usedQuestionIds)
  if (gameType === 'survey-showdown') return selectSurveyShowdownPrompts(6, usedQuestionIds)
  if (gameType === 'say-what-you-see') {
    return selectSayWhatYouSeePuzzles(settings.roundCount || 10, usedQuestionIds)
  }
  if (gameType === 'quickfire-30') return selectQuickfire30Cards(64, usedQuestionIds)
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
  player.teamId = null
  player.buzzedOut = false
  if (resetScore) player.score = 0
}

export function createSurveyTeams(players) {
  const teams = [
    { id: 'lime', name: 'Lime Team', score: 0, playerIds: [] },
    { id: 'violet', name: 'Violet Team', score: 0, playerIds: [] },
  ]
  players.forEach((player, index) => {
    const team = teams[index % teams.length]
    player.teamId = team.id
    team.playerIds.push(player.id)
  })
  return teams
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
  player.buzzedOut = false
}

export function createPlayer(socketId, name, settings) {
  const player = {
    id: crypto.randomUUID(),
    socketId,
    sessionToken: crypto.randomUUID(),
    name,
    connected: true,
    score: 0,
    ladderRole: null,
  }
  resetPlayer(player, settings)
  return player
}
