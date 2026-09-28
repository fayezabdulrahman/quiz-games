import assert from 'node:assert/strict'
import test from 'node:test'
import {
  emptyQuestionForm,
  formFromQuestion,
  validateCustomQuestion,
} from './customQuestionSchemas.js'

test('validates a Quizcraft multiple-choice question with optional media', () => {
  const result = validateCustomQuestion('quizcraft', {
    prompt: 'Which planet is known as the Red Planet?',
    questionType: 'multiple_choice',
    options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
    answer: 'Mars',
    explanation: 'Iron oxide gives Mars its red appearance.',
    media: [{ type: 'image', src: 'https://example.com/mars.jpg', alt: 'Mars' }],
  })

  assert.equal(result.isComplete, true)
  assert.equal(result.row.questionKind, 'multiple_choice')
  assert.deepEqual(result.row.payload.options, ['Venus', 'Mars', 'Jupiter', 'Mercury'])
  assert.equal(result.row.payload.media[0].alt, 'Mars')
})

test('normalizes Quizcraft true-or-false questions to two answers', () => {
  const result = validateCustomQuestion('quizcraft', {
    prompt: 'The Pacific Ocean is larger than the Atlantic Ocean.',
    questionType: 'true_false',
    options: ['Anything', 'Else'],
    answer: 'True',
  })

  assert.equal(result.isComplete, true)
  assert.equal(result.row.questionKind, 'true_false')
  assert.deepEqual(result.row.payload.options, ['True', 'False'])
})

test('restores and initializes Quizcraft editor forms', () => {
  assert.deepEqual(emptyQuestionForm('quizcraft').options, ['', '', '', ''])
  assert.deepEqual(
    formFromQuestion({
      gameType: 'quizcraft',
      questionKind: 'true_false',
      prompt: 'Water freezes at zero degrees Celsius.',
      answer: 'True',
      payload: { questionType: 'true_false', options: ['True', 'False'] },
    }).options,
    ['True', 'False'],
  )
})
