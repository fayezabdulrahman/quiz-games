import { validateCustomQuestion } from '../../shared/customQuestionSchemas.js'

export const AI_SUPPORTED_GAMES = new Set([
  'one-percent', 'million-ladder', 'bluff-battle', 'majority-rules',
  'survey-showdown', 'quickfire-30',
])

const specs = {
  'one-percent': {
    instructions: 'Create a lateral-thinking question. Use choice mode with 4 distinct options. difficulty must be one of 90,80,70,60,50,40,30,20,10,1. answer must exactly match an option.',
    schema: { prompt: 'string', detail: 'string', difficulty: 'number', type: 'choice', options: ['string'], answer: 'string', acceptedAnswers: ['string'], explanation: 'string' },
  },
  'million-ladder': {
    instructions: 'Create a factual multiple-choice trivia question. rung is 1 through 15, with difficulty increasing by rung. Supply exactly 4 distinct options and make answer exactly match one option.',
    schema: { prompt: 'string', rung: 'number', options: ['string'], answer: 'string', explanation: 'string' },
  },
  'bluff-battle': {
    instructions: 'Create an interesting factual question with one concise verifiable real answer. inputMode is text or numeric.',
    schema: { prompt: 'string', answer: 'string', inputMode: 'text', explanation: 'string' },
  },
  'majority-rules': {
    instructions: 'Create a subjective group preference question with 2 to 6 concise, non-overlapping choices. There is no correct answer.',
    schema: { prompt: 'string', options: ['string'], explanation: 'string' },
  },
  'survey-showdown': {
    instructions: 'Create a family-game survey-style prompt with 3 to 8 plausible answers. Integer points must be positive and total exactly 100. accepted includes the answer text and useful aliases. Never claim these results came from a real survey.',
    schema: { prompt: 'string', answers: [{ text: 'string', points: 'number', accepted: ['string'] }], explanation: 'string' },
  },
  'quickfire-30': {
    instructions: 'Create exactly 5 distinct, family-friendly terms suitable for a verbal guessing card. Keep terms related by the requested topic but not synonyms of one another.',
    schema: { terms: ['string'] },
  },
}

export function buildGenerationMessages(gameType, topic = '') {
  const spec = specs[gameType]
  if (!spec) throw Object.assign(new Error('AI generation is not available for this game.'), { status: 400 })
  const subject = String(topic || '').trim().slice(0, 300)
  return [
    {
      role: 'system',
      content: `You create concise, accurate, family-friendly party-game questions. Avoid unsafe, sexual, hateful, personally targeted, political persuasion, or invasive content. Do not invent sources or polling. Return only one JSON object, with no markdown. ${spec.instructions}`,
    },
    {
      role: 'user',
      content: `${subject ? `Topic or notes: ${subject}` : 'Choose a fun, broadly accessible surprise topic.'}\nRequired JSON shape: ${JSON.stringify(spec.schema)}`,
    },
  ]
}

function stripGeneratedMedia(value) {
  if (Array.isArray(value)) return value.map(stripGeneratedMedia)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['media', 'storageKey', 'src'].includes(key))
    .map(([key, item]) => [key, stripGeneratedMedia(item)]))
}

export function validateGeneratedForm(gameType, candidate) {
  const cleaned = stripGeneratedMedia(candidate)
  const validation = validateCustomQuestion(gameType, cleaned)
  if (!validation.isComplete) {
    const detail = validation.errors.map((item) => item.message).join(' ')
    throw Object.assign(new Error(`The AI returned an incomplete question. ${detail}`), { status: 502 })
  }
  if (gameType === 'survey-showdown') {
    const total = validation.form.answers.reduce((sum, answer) => sum + answer.points, 0)
    if (total !== 100) throw Object.assign(new Error('The AI survey points did not total 100.'), { status: 502 })
  }
  return validation.form
}
