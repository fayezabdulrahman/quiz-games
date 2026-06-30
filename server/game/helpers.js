import crypto from 'node:crypto'
import { selectQuestionsForGame } from '../db/questions/selector.js'

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

export function normalizeBoundedInteger(value, { min, max, defaultValue }) {
  const count = Number.parseInt(value, 10)
  return Number.isFinite(count) ? Math.min(Math.max(count, min), max) : defaultValue
}

export function normalizeCatchphraseGuessSeconds(value) {
  return normalizeBoundedInteger(value, { min: 5, max: 30, defaultValue: 10 })
}

export function settingsForGame(gameType, settings = {}) {
  if (gameType === 'majority-rules') {
    return {
      roundCount: normalizeBoundedInteger(settings.roundCount, {
        min: 3,
        max: 20,
        defaultValue: 8,
      }),
    }
  }
  if (gameType === 'bluff-battle') {
    return {
      roundCount: normalizeBoundedInteger(settings.roundCount, {
        min: 3,
        max: 20,
        defaultValue: 6,
      }),
    }
  }
  if (gameType === 'million-ladder') return { roundCount: 15 }
  if (gameType === 'survey-showdown') return { roundCount: 6 }
  if (gameType === 'say-what-you-see') {
    return {
      roundCount: normalizeBoundedInteger(settings.roundCount, {
        min: 3,
        max: 20,
        defaultValue: 10,
      }),
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
    lifelineCount: normalizeBoundedInteger(settings.lifelineCount, {
      min: 0,
      max: 10,
      defaultValue: 1,
    }),
    lifelinesAnytime: Boolean(settings.lifelinesAnytime),
  }
}

export async function questionsForGame(gameType, usedQuestionIds, settings = {}) {
  return selectQuestionsForGame(gameType, usedQuestionIds, settings)
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
