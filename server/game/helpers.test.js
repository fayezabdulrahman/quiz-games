import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateQuizcraftScore, settingsForGame } from './helpers.js'

test('normalizes custom timers and game lengths for every game', () => {
  const expectations = {
    'one-percent': [10, 10],
    'majority-rules': [20, 20],
    'bluff-battle': [20, 20],
    'million-ladder': [15, 15],
    'survey-showdown': [12, 12],
    'quickfire-30': [50, 50],
    'say-what-you-see': [20, 20],
  }

  for (const [gameType, [roundCount, expectedBoardLength]] of Object.entries(expectations)) {
    const settings = settingsForGame(gameType, { roundCount: 999, questionSeconds: 999 })
    assert.equal(settings.roundCount, roundCount)
    assert.equal(settings.questionSeconds, 180)
    if (gameType === 'quickfire-30') assert.equal(settings.boardLength, expectedBoardLength)
  }
})

test('uses existing game defaults when custom values are missing', () => {
  assert.deepEqual(
    Object.fromEntries(
      ['one-percent', 'majority-rules', 'bluff-battle', 'million-ladder', 'survey-showdown', 'quickfire-30', 'say-what-you-see']
        .map((gameType) => [gameType, settingsForGame(gameType).roundCount]),
    ),
    {
      'one-percent': 10,
      'majority-rules': 8,
      'bluff-battle': 6,
      'million-ladder': 15,
      'survey-showdown': 6,
      'quickfire-30': 30,
      'say-what-you-see': 10,
    },
  )
})

test('forces Quizcraft to a selected custom quiz', () => {
  assert.deepEqual(
    settingsForGame('quizcraft', {
      contentSelectionMode: 'official',
      preferredQuestionSetId: 'quiz-id',
      questionSeconds: 45,
    }),
    {
      contentSelectionMode: 'user_only',
      maxSpeedBonus: 100,
      pointsPerCorrect: 100,
      preferredQuestionSetId: 'quiz-id',
      questionSeconds: 45,
      speedBonusEnabled: true,
    },
  )
})

test('awards faster Quizcraft answers a larger speed bonus', () => {
  const shared = {
    isCorrect: true,
    questionSeconds: 30,
    pointsPerCorrect: 100,
    speedBonusEnabled: true,
    maxSpeedBonus: 100,
  }
  const fastest = calculateQuizcraftScore({ ...shared, answerElapsedMs: 0 })
  const middle = calculateQuizcraftScore({ ...shared, answerElapsedMs: 15_000 })
  const slowest = calculateQuizcraftScore({ ...shared, answerElapsedMs: 30_000 })

  assert.deepEqual(fastest, { basePoints: 100, speedBonus: 100, totalPoints: 200 })
  assert.deepEqual(middle, { basePoints: 100, speedBonus: 50, totalPoints: 150 })
  assert.deepEqual(slowest, { basePoints: 100, speedBonus: 0, totalPoints: 100 })
})

test('Quizcraft speed scoring can be disabled', () => {
  assert.deepEqual(
    calculateQuizcraftScore({
      isCorrect: true,
      answerElapsedMs: 0,
      questionSeconds: 30,
      pointsPerCorrect: 250,
      speedBonusEnabled: false,
      maxSpeedBonus: 1000,
    }),
    { basePoints: 250, speedBonus: 0, totalPoints: 250 },
  )
})
