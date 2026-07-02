import { difficulties } from './shared.js'

export { difficulties }

export const sampleOnePercentQuestions = difficulties.map((difficulty, index) => ({
  id: `sample-one-percent-${difficulty}`,
  difficulty,
  type: 'choice',
  prompt: `Sample ${difficulty}% question: which option matches the number ${index + 1}?`,
  options: [`Option ${index + 1}`, `Option ${index + 2}`, `Option ${index + 3}`],
  answer: `Option ${index + 1}`,
  explanation: 'This is public sample content for local fallback and smoke tests.',
}))
