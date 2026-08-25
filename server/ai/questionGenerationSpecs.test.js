import assert from 'node:assert/strict'
import test from 'node:test'
import { AI_SUPPORTED_GAMES, buildGenerationMessages, validateGeneratedForm } from './questionGenerationSpecs.js'

const valid = {
  'one-percent': { prompt: 'Which word is odd?', detail: 'Look closely.', difficulty: 90, type: 'choice', options: ['Cat', 'Dog', 'Car', 'Fox'], answer: 'Car', acceptedAnswers: ['Car'], explanation: 'The others are animals.' },
  'million-ladder': { prompt: 'What is the capital of France?', rung: 1, options: ['Paris', 'Rome', 'Lima', 'Oslo'], answer: 'Paris', explanation: 'Paris is the capital.' },
  'bluff-battle': { prompt: 'What is the largest ocean?', answer: 'Pacific Ocean', inputMode: 'text', explanation: 'It is the largest ocean.' },
  'majority-rules': { prompt: 'Best movie snack?', options: ['Popcorn', 'Sweets', 'Nachos'], explanation: 'Choose your favourite.' },
  'survey-showdown': { prompt: 'Name something found at a beach.', answers: [{ text: 'Sand', points: 50, accepted: ['Sand'] }, { text: 'Sea', points: 30, accepted: ['Sea', 'Ocean'] }, { text: 'Shells', points: 20, accepted: ['Shells'] }], explanation: 'Plausible game values, not a real poll.' },
  'quickfire-30': { terms: ['Boot', 'Goal', 'Referee', 'Stadium', 'Corner'] },
  'word-wheel': { prompt: 'Things you might find in a kitchen' },
}

for (const gameType of AI_SUPPORTED_GAMES) {
  test(`${gameType} accepts a complete generated form`, () => {
    assert.doesNotThrow(() => validateGeneratedForm(gameType, valid[gameType]))
    assert.match(buildGenerationMessages(gameType, 'football')[1].content, /football/)
  })
}

test('generated media and storage fields are discarded', () => {
  const form = validateGeneratedForm('bluff-battle', { ...valid['bluff-battle'], media: [{ src: 'https://bad.test/a.png', storageKey: 'bad' }] })
  assert.deepEqual(form.media, [])
})

test('incomplete and invalid survey output is rejected', () => {
  assert.throws(() => validateGeneratedForm('million-ladder', { prompt: 'Missing fields' }), /incomplete/)
  assert.throws(() => validateGeneratedForm('survey-showdown', {
    ...valid['survey-showdown'],
    answers: valid['survey-showdown'].answers.map((answer) => ({ ...answer, points: 10 })),
  }), /total 100/)
})
