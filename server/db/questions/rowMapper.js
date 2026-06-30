function arrayOrNull(value) {
  return Array.isArray(value) ? value : null
}

function acceptedAnswers(row, payload) {
  return arrayOrNull(payload.acceptedAnswers) || (row.answer ? [row.answer] : [])
}

function baseQuestion(row) {
  return {
    id: row.externalId || row.id,
    prompt: row.prompt,
    answer: row.answer,
    explanation: row.explanation,
  }
}

const mappers = {
  'one-percent': (row, payload) => ({
    ...baseQuestion(row),
    difficulty: row.difficulty,
    type: payload.legacyType || (row.questionKind === 'multiple_choice' ? 'choice' : 'input'),
    detail: payload.detail || null,
    options: arrayOrNull(payload.options) || undefined,
    answer: acceptedAnswers(row, payload),
  }),
  'bluff-battle': (row, payload) => ({
    ...baseQuestion(row),
    inputMode: payload.inputMode || undefined,
  }),
  'majority-rules': (row, payload) => ({
    ...baseQuestion(row),
    options: arrayOrNull(payload.options) || [],
  }),
  'million-ladder': (row, payload) => ({
    ...baseQuestion(row),
    rung: payload.rung,
    type: payload.legacyType || 'choice',
    options: arrayOrNull(payload.options) || [],
  }),
  'survey-showdown': (row, payload) => ({
    ...baseQuestion(row),
    answers: arrayOrNull(payload.answers) || [],
  }),
  'quickfire-30': (row, payload) => ({
    id: row.externalId || row.id,
    terms: arrayOrNull(payload.terms) || [],
  }),
  'say-what-you-see': (row, payload) => ({
    ...baseQuestion(row),
    acceptedOverride: acceptedAnswers(row, payload),
    layout: payload.layout,
    tokens: arrayOrNull(payload.tokens) || [],
  }),
}

export function mapQuestionRow(row) {
  const payload = row.payload || {}
  const mapper = mappers[row.gameType]
  if (!mapper) return null
  return mapper(row, payload)
}
