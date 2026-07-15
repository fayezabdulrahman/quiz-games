import assert from 'node:assert/strict'
import test from 'node:test'
import { settingsForGame } from './helpers.js'

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
