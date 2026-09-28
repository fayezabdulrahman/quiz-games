import crypto from 'node:crypto'
import { selectQuestionsForGame } from '../db/questions/selector.js'
import { normalizeSelectionMode } from '../db/questions/customPacks.js'

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

export function normalizeQuestionSeconds(value) {
  return normalizeBoundedInteger(value, { min: 5, max: 180, defaultValue: 30 })
}

export function calculateQuizcraftScore({
  isCorrect,
  answerElapsedMs,
  questionSeconds,
  pointsPerCorrect,
  speedBonusEnabled,
  maxSpeedBonus,
}) {
  if (!isCorrect) return { basePoints: 0, speedBonus: 0, totalPoints: 0 }

  const basePoints = normalizeBoundedInteger(pointsPerCorrect, {
    min: 50,
    max: 1000,
    defaultValue: 100,
  })
  if (!speedBonusEnabled) return { basePoints, speedBonus: 0, totalPoints: basePoints }

  const bonusLimit = normalizeBoundedInteger(maxSpeedBonus, {
    min: 50,
    max: 1000,
    defaultValue: 100,
  })
  const durationMs = normalizeQuestionSeconds(questionSeconds) * 1000
  const elapsedValue = Number(answerElapsedMs)
  const elapsedMs = Math.max(
    0,
    Math.min(Number.isFinite(elapsedValue) ? elapsedValue : durationMs, durationMs),
  )
  const speedBonus = Math.round(bonusLimit * (1 - elapsedMs / durationMs))

  return { basePoints, speedBonus, totalPoints: basePoints + speedBonus }
}

function withAccessMode(normalized, settings) {
  const contentSettings =
    settings.accessMode === 'demo'
      ? {}
      : {
          contentSelectionMode: normalizeSelectionMode(settings.contentSelectionMode),
          preferredQuestionSetId: settings.preferredQuestionSetId || null,
        }
  return settings.accessMode === 'demo'
    ? { ...normalized, accessMode: 'demo', contentSelectionMode: 'official', preferredQuestionSetId: null }
    : { ...normalized, ...contentSettings }
}

export function settingsForGame(gameType, settings = {}) {
  const timed = { questionSeconds: normalizeQuestionSeconds(settings.questionSeconds) }
  if (gameType === 'quizcraft') {
    return withAccessMode({
      ...timed,
      pointsPerCorrect: normalizeBoundedInteger(settings.pointsPerCorrect, {
        min: 50,
        max: 1000,
        defaultValue: 100,
      }),
      speedBonusEnabled: settings.speedBonusEnabled !== false,
      maxSpeedBonus: normalizeBoundedInteger(settings.maxSpeedBonus, {
        min: 50,
        max: 1000,
        defaultValue: 100,
      }),
    }, {
      ...settings,
      contentSelectionMode: 'user_only',
    })
  }
  if (gameType === 'majority-rules') {
    return withAccessMode({
      ...timed,
      roundCount:
        settings.accessMode === 'demo'
          ? 8
          : normalizeBoundedInteger(settings.roundCount, {
              min: 3,
              max: 20,
              defaultValue: 8,
            }),
    }, settings)
  }
  if (gameType === 'bluff-battle') {
    return withAccessMode({
      ...timed,
      roundCount: normalizeBoundedInteger(settings.roundCount, {
        min: 3,
        max: 20,
        defaultValue: 6,
      }),
    }, settings)
  }
  if (gameType === 'million-ladder') return withAccessMode({
    ...timed,
    roundCount: normalizeBoundedInteger(settings.roundCount, { min: 5, max: 15, defaultValue: 15 }),
  }, settings)
  if (gameType === 'survey-showdown') return withAccessMode({
    ...timed,
    roundCount: normalizeBoundedInteger(settings.roundCount, { min: 3, max: 12, defaultValue: 6 }),
  }, settings)
  if (gameType === 'say-what-you-see') {
    return withAccessMode({
      ...timed,
      roundCount: normalizeBoundedInteger(settings.roundCount, {
        min: 3,
        max: 20,
        defaultValue: 10,
      }),
      guessTimerEnabled: Boolean(settings.guessTimerEnabled),
      guessSeconds: normalizeCatchphraseGuessSeconds(settings.guessSeconds),
    }, settings)
  }
  if (gameType === 'quickfire-30') {
    return withAccessMode({
      ...timed,
      diceMode: settings.diceMode === 'manual' ? 'manual' : 'digital',
      roundCount: normalizeBoundedInteger(settings.roundCount, { min: 10, max: 50, defaultValue: 30 }),
      boardLength: normalizeBoundedInteger(settings.roundCount, { min: 10, max: 50, defaultValue: 30 }),
    }, settings)
  }
  if (gameType === 'word-wheel') {
    return withAccessMode({
      ...timed,
      inputMode: settings.inputMode === 'speak' ? 'speak' : 'type',
      turnSeconds: normalizeBoundedInteger(settings.questionSeconds || settings.turnSeconds, {
        min: 5,
        max: 60,
        defaultValue: 15,
      }),
      targetScore: normalizeBoundedInteger(settings.roundCount || settings.targetScore, {
        min: 1,
        max: 10,
        defaultValue: 5,
      }),
      roundCount: normalizeBoundedInteger(settings.roundCount || settings.targetScore, {
        min: 1,
        max: 10,
        defaultValue: 5,
      }),
    }, settings)
  }
  return withAccessMode({
    ...timed,
    roundCount: normalizeBoundedInteger(settings.roundCount, { min: 3, max: 10, defaultValue: 10 }),
    lifelineCount: normalizeBoundedInteger(settings.lifelineCount, {
      min: 0,
      max: 10,
      defaultValue: 1,
    }),
    lifelinesAnytime: Boolean(settings.lifelinesAnytime),
  }, settings)
}

export async function questionsForGame(gameType, usedQuestionIds, settings = {}, context = {}) {
  return selectQuestionsForGame(gameType, usedQuestionIds, settings, context)
}

export function resetPlayer(player, settings, resetScore = false) {
  player.active = true
  player.hasAnswered = false
  player.answer = null
  player.isCorrect = null
  player.passedCurrentQuestion = false
  player.lifelinesRemaining = settings.lifelineCount || 0
  player.roundPoints = 0
  player.roundBasePoints = 0
  player.roundSpeedBonus = 0
  player.answerElapsedMs = null
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
  player.roundBasePoints = 0
  player.roundSpeedBonus = 0
  player.answerElapsedMs = null
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
