import { bluffPromptPool } from '../../questions/bluffBattle/index.js'
import { majorityPromptPool } from '../../questions/commonAnswer/index.js'
import { millionLadderQuestions } from '../../questions/millionLadder/index.js'
import { questionPool } from '../../questions/onePercent/index.js'
import { quickfire30Pool } from '../../questions/quickfire30/index.js'
import { sayWhatYouSeePuzzles } from '../../questions/sayWhatYouSee/index.js'
import { surveyShowdownPool } from '../../questions/surveyShowdown/index.js'

const set = ({ gameType, title, questions }) => ({
  source: 'official',
  gameType,
  slug: `${gameType}-official-v1`,
  title,
  status: 'active',
  isDefaultForGame: true,
  questions,
})

function canonicalAnswer(answer) {
  return Array.isArray(answer) ? answer[0] : answer || null
}

function baseQuestion(gameType, question, questionKind, payload = {}) {
  return {
    source: 'official',
    gameType,
    externalId: question.id,
    status: 'active',
    questionKind,
    schemaVersion: 1,
    prompt: question.prompt || null,
    answer: canonicalAnswer(question.answer),
    explanation: question.explanation || null,
    difficulty: typeof question.difficulty === 'number' ? question.difficulty : null,
    payload,
  }
}

export const officialQuestionSets = [
  set({
    gameType: 'one-percent',
    title: 'Official 1% Club Pool',
    questions: questionPool.map((question) =>
      baseQuestion('one-percent', question, question.type === 'choice' ? 'multiple_choice' : 'text_input', {
        legacyType: question.type,
        detail: question.detail || null,
        options: question.options || null,
        acceptedAnswers: Array.isArray(question.answer) ? question.answer : [question.answer],
      })
    ),
  }),
  set({
    gameType: 'bluff-battle',
    title: 'Official Bluff Battle Pool',
    questions: bluffPromptPool.map((question) =>
      baseQuestion('bluff-battle', question, 'fact_answer', {
        inputMode: question.inputMode || 'text',
      })
    ),
  }),
  set({
    gameType: 'majority-rules',
    title: 'Official Majority Rules Pool',
    questions: majorityPromptPool.map((question) =>
      baseQuestion('majority-rules', question, 'opinion_choice', {
        options: question.options,
      })
    ),
  }),
  set({
    gameType: 'million-ladder',
    title: 'Official Million Ladder Pool',
    questions: millionLadderQuestions.map((question) =>
      baseQuestion('million-ladder', question, 'multiple_choice', {
        legacyType: question.type,
        rung: question.rung,
        options: question.options,
      })
    ),
  }),
  set({
    gameType: 'survey-showdown',
    title: 'Official Survey Showdown Pool',
    questions: surveyShowdownPool.map((question) =>
      baseQuestion('survey-showdown', question, 'survey_answers', {
        answers: question.answers,
      })
    ),
  }),
  set({
    gameType: 'quickfire-30',
    title: 'Official Quickfire 30 Pool',
    questions: quickfire30Pool.map((question) =>
      baseQuestion('quickfire-30', question, 'term_card', {
        terms: question.terms,
      })
    ),
  }),
  set({
    gameType: 'say-what-you-see',
    title: 'Official Say What You See Pool',
    questions: sayWhatYouSeePuzzles.map((question) =>
      baseQuestion('say-what-you-see', question, 'visual_puzzle', {
        acceptedAnswers: question.acceptedOverride || [question.answer],
        layout: question.layout,
        tokens: question.tokens,
      })
    ),
  }),
]
