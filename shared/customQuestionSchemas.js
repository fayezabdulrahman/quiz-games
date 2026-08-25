export const CONTENT_SELECTION_MODES = ['official', 'mixed', 'user_only']

export const ONE_PERCENT_DIFFICULTIES = [90, 80, 70, 60, 50, 40, 30, 20, 10, 1]

export const SAY_WHAT_YOU_SEE_LAYOUTS = [
  'square-one',
  'between-lines',
  'over-moon',
  'long-time',
  'corner-shop',
  'double-cross',
  'rising-star',
  'head-heels',
  'step-by-step',
  'mixed-feelings',
  'cycle-lane',
  'last-largest',
  'middle-nowhere',
  'time-after-time',
  'down-earth',
  'top-secret',
  'under-cover',
  'high-five',
  'big-deal',
  'small-talk',
  'left-out',
  'crossroads',
  'apple-turnover',
  'safe-sound',
  'cut-above',
  'blue-moon',
  'long-story-short',
  'eye-sky',
  'count-me-in',
  'all-over-place',
  'no-idea',
  'right-on-time',
  'blank-space',
  'stand-by-me',
  'inside-job',
]

export const GAME_QUESTION_BUILDERS = {
  'one-percent': {
    title: 'The 1% Club',
    questionKind: 'multiple_choice',
    minimumActiveQuestions: 10,
  },
  'million-ladder': {
    title: 'Million Ladder',
    questionKind: 'multiple_choice',
    minimumActiveQuestions: 15,
  },
  'bluff-battle': {
    title: 'Bluff Battle',
    questionKind: 'fact_answer',
    minimumActiveQuestions: 6,
  },
  'majority-rules': {
    title: 'Majority Rules',
    questionKind: 'opinion_choice',
    minimumActiveQuestions: 8,
  },
  'survey-showdown': {
    title: 'Survey Showdown',
    questionKind: 'survey_answers',
    minimumActiveQuestions: 6,
  },
  'quickfire-30': {
    title: 'Quickfire 30',
    questionKind: 'term_card',
    minimumActiveQuestions: 64,
  },
  'say-what-you-see': {
    title: 'Say What You See',
    questionKind: 'visual_puzzle',
    minimumActiveQuestions: 10,
  },
  'word-wheel': {
    title: 'Word Wheel',
    questionKind: 'category_card',
    minimumActiveQuestions: 20,
  },
}

const MAX_PROMPT_LENGTH = 360
const MAX_TEXT_LENGTH = 160
const MAX_EXPLANATION_LENGTH = 420
const MAX_IMAGE_ATTACHMENTS = 4
const MAX_IMAGE_SRC_LENGTH = 2_000
const MAX_STORAGE_KEY_LENGTH = 512

function cleanText(value, maxLength = MAX_TEXT_LENGTH) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

function cleanLongText(value, maxLength = MAX_PROMPT_LENGTH) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

function cleanImageMedia(input = []) {
  return (Array.isArray(input) ? input : [])
    .map((item) => ({
      type: 'image',
      src: String(item?.src || '').trim(),
      alt: cleanText(item?.alt || item?.name || 'Question image', 120),
      storageKey: cleanText(item?.storageKey, MAX_STORAGE_KEY_LENGTH),
    }))
    .filter((item) => {
      if (!item.src || item.src.length > MAX_IMAGE_SRC_LENGTH) return false
      return /^https?:\/\//i.test(item.src)
    })
    .slice(0, MAX_IMAGE_ATTACHMENTS)
}

function cleanList(values, maxItems, maxLength = MAX_TEXT_LENGTH) {
  return (Array.isArray(values) ? values : [])
    .map((value) => cleanText(value, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function uniqueList(values) {
  const seen = new Set()
  return values.filter((value) => {
    const key = value.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function error(message, field) {
  return { field, message }
}

function baseForm(input = {}) {
  return {
    prompt: cleanLongText(input.prompt),
    answer: cleanText(input.answer),
    explanation: cleanLongText(input.explanation, MAX_EXPLANATION_LENGTH),
    media: cleanImageMedia(input.media),
  }
}

function mediaPayload(form) {
  return form.media?.length ? { media: form.media } : {}
}

function validatePrompt(form, errors) {
  if (!form.prompt) errors.push(error('Add the prompt players will see.', 'prompt'))
}

function buildOnePercent(input) {
  const form = {
    ...baseForm(input),
    difficulty: Number(input.difficulty),
    type: input.type === 'input' ? 'input' : 'choice',
    detail: cleanLongText(input.detail),
    options: uniqueList(cleanList(input.options, 6)),
    acceptedAnswers: uniqueList(cleanList(input.acceptedAnswers, 8)),
  }
  const errors = []
  validatePrompt(form, errors)
  if (!ONE_PERCENT_DIFFICULTIES.includes(form.difficulty)) {
    errors.push(error('Choose a difficulty rung.', 'difficulty'))
  }
  if (form.type === 'choice') {
    if (form.options.length < 2) errors.push(error('Add at least two answer options.', 'options'))
    if (!form.answer) errors.push(error('Choose the correct option.', 'answer'))
    if (form.answer && !form.options.includes(form.answer)) {
      errors.push(error('The correct answer must match one of the options.', 'answer'))
    }
  } else if (!form.acceptedAnswers.length && !form.answer) {
    errors.push(error('Add at least one accepted answer.', 'acceptedAnswers'))
  }
  const acceptedAnswers =
    form.type === 'choice'
      ? [form.answer]
      : uniqueList([form.answer, ...form.acceptedAnswers].filter(Boolean))

  return {
    form: { ...form, acceptedAnswers },
    errors,
    row: {
      questionKind: form.type === 'choice' ? 'multiple_choice' : 'text_input',
      prompt: form.prompt,
      answer: acceptedAnswers[0] || null,
      explanation: form.explanation || null,
      difficulty: form.difficulty,
      payload: {
        ...mediaPayload(form),
        legacyType: form.type,
        detail: form.detail || null,
        options: form.type === 'choice' ? form.options : null,
        acceptedAnswers,
      },
    },
  }
}

function buildMillionLadder(input) {
  const form = {
    ...baseForm(input),
    rung: Number(input.rung),
    options: cleanList(input.options, 4),
  }
  const errors = []
  validatePrompt(form, errors)
  if (!Number.isInteger(form.rung) || form.rung < 1 || form.rung > 15) {
    errors.push(error('Choose a ladder rung from 1 to 15.', 'rung'))
  }
  if (form.options.length !== 4) errors.push(error('Add exactly four answer options.', 'options'))
  if (!form.answer) errors.push(error('Choose the correct option.', 'answer'))
  if (form.answer && !form.options.includes(form.answer)) {
    errors.push(error('The correct answer must match one of the options.', 'answer'))
  }
  return {
    form,
    errors,
    row: {
      questionKind: 'multiple_choice',
      prompt: form.prompt,
      answer: form.answer || null,
      explanation: form.explanation || null,
      difficulty: null,
      payload: {
        ...mediaPayload(form),
        legacyType: 'choice',
        rung: Number.isInteger(form.rung) ? form.rung - 1 : null,
        options: form.options,
        acceptedAnswers: form.answer ? [form.answer] : [],
      },
    },
  }
}

function buildBluffBattle(input) {
  const form = {
    ...baseForm(input),
    inputMode: input.inputMode === 'numeric' ? 'numeric' : 'text',
  }
  const errors = []
  validatePrompt(form, errors)
  if (!form.answer) errors.push(error('Add the real answer.', 'answer'))
  return {
    form,
    errors,
    row: {
      questionKind: 'fact_answer',
      prompt: form.prompt,
      answer: form.answer || null,
      explanation: form.explanation || null,
      difficulty: null,
      payload: { ...mediaPayload(form), inputMode: form.inputMode },
    },
  }
}

function buildMajorityRules(input) {
  const form = {
    ...baseForm(input),
    options: uniqueList(cleanList(input.options, 6)),
  }
  const errors = []
  validatePrompt(form, errors)
  if (form.options.length < 2 || form.options.length > 6) {
    errors.push(error('Add between two and six choices.', 'options'))
  }
  return {
    form,
    errors,
    row: {
      questionKind: 'opinion_choice',
      prompt: form.prompt,
      answer: null,
      explanation: form.explanation || null,
      difficulty: null,
      payload: { ...mediaPayload(form), options: form.options },
    },
  }
}

function buildSurveyShowdown(input) {
  const answers = (Array.isArray(input.answers) ? input.answers : [])
    .map((item) => ({
      text: cleanText(item?.text),
      points: Number(item?.points),
      accepted: uniqueList(cleanList(item?.accepted, 8)),
    }))
    .filter((item) => item.text)
    .slice(0, 8)
    .map((item) => ({
      ...item,
      points: Number.isFinite(item.points) ? Math.max(0, Math.min(100, Math.round(item.points))) : 0,
      accepted: uniqueList([item.text, ...item.accepted]),
    }))
  const form = { ...baseForm(input), answers }
  const errors = []
  const warnings = []
  validatePrompt(form, errors)
  if (answers.length < 3 || answers.length > 8) {
    errors.push(error('Add between three and eight survey answers.', 'answers'))
  }
  if (answers.some((item) => item.points <= 0)) {
    errors.push(error('Each survey answer needs points greater than zero.', 'answers'))
  }
  const totalPoints = answers.reduce((sum, item) => sum + item.points, 0)
  if (answers.length && totalPoints !== 100) {
    warnings.push(error('Survey answer points do not total 100.', 'answers'))
  }
  return {
    form,
    errors,
    warnings,
    row: {
      questionKind: 'survey_answers',
      prompt: form.prompt,
      answer: null,
      explanation: form.explanation || null,
      difficulty: null,
      payload: { ...mediaPayload(form), answers },
    },
  }
}

function buildQuickfire30(input) {
  const form = {
    terms: uniqueList(cleanList(input.terms, 5)),
  }
  const errors = []
  if (form.terms.length !== 5) errors.push(error('Add exactly five terms.', 'terms'))
  return {
    form,
    errors,
    row: {
      questionKind: 'term_card',
      prompt: null,
      answer: null,
      explanation: null,
      difficulty: null,
      payload: { terms: form.terms },
    },
  }
}

function buildSayWhatYouSee(input) {
  const form = {
    ...baseForm(input),
    layout: SAY_WHAT_YOU_SEE_LAYOUTS.includes(input.layout) ? input.layout : 'square-one',
    tokens: cleanList(input.tokens, 6, 40),
    acceptedAnswers: uniqueList(cleanList(input.acceptedAnswers, 8)),
  }
  const errors = []
  if (!form.answer) errors.push(error('Add the phrase answer.', 'answer'))
  if (!form.tokens.length) errors.push(error('Add the visible puzzle tokens.', 'tokens'))
  const acceptedAnswers = uniqueList([form.answer, ...form.acceptedAnswers].filter(Boolean))
  return {
    form: { ...form, acceptedAnswers },
    errors,
    row: {
      questionKind: 'visual_puzzle',
      prompt: null,
      answer: form.answer || null,
      explanation: form.explanation || null,
      difficulty: null,
      payload: {
        ...mediaPayload(form),
        acceptedAnswers,
        layout: form.layout,
        tokens: form.tokens,
      },
    },
  }
}

function buildWordWheel(input) {
  const form = {
    prompt: cleanLongText(input.prompt),
  }
  const errors = []
  validatePrompt(form, errors)
  return {
    form,
    errors,
    row: {
      questionKind: 'category_card',
      prompt: form.prompt,
      answer: null,
      explanation: null,
      difficulty: null,
      payload: {},
    },
  }
}

const builders = {
  'one-percent': buildOnePercent,
  'million-ladder': buildMillionLadder,
  'bluff-battle': buildBluffBattle,
  'majority-rules': buildMajorityRules,
  'survey-showdown': buildSurveyShowdown,
  'quickfire-30': buildQuickfire30,
  'say-what-you-see': buildSayWhatYouSee,
  'word-wheel': buildWordWheel,
}

export function validateCustomQuestion(gameType, input = {}) {
  const builder = builders[gameType]
  if (!builder) {
    return {
      form: input,
      errors: [error('Choose a supported game.', 'gameType')],
      warnings: [],
      row: null,
    }
  }
  const result = builder(input)
  const isComplete = result.errors.length === 0
  return {
    warnings: [],
    ...result,
    isComplete,
  }
}

export function formFromQuestion(question) {
  const payload = question?.payload || {}
  if (question?.gameType === 'one-percent') {
    const type = payload.legacyType || (question.questionKind === 'multiple_choice' ? 'choice' : 'input')
    return {
      prompt: question.prompt || '',
      detail: payload.detail || '',
      difficulty: question.difficulty || 90,
      type,
      options: payload.options || ['', '', '', ''],
      answer: question.answer || '',
      acceptedAnswers: payload.acceptedAnswers || (question.answer ? [question.answer] : []),
      explanation: question.explanation || '',
      media: cleanImageMedia(payload.media),
    }
  }
  if (question?.gameType === 'million-ladder') {
    return {
      prompt: question.prompt || '',
      rung: typeof payload.rung === 'number' ? payload.rung + 1 : 1,
      options: payload.options || ['', '', '', ''],
      answer: question.answer || '',
      explanation: question.explanation || '',
      media: cleanImageMedia(payload.media),
    }
  }
  if (question?.gameType === 'bluff-battle') {
    return {
      prompt: question.prompt || '',
      answer: question.answer || '',
      inputMode: payload.inputMode || 'text',
      explanation: question.explanation || '',
      media: cleanImageMedia(payload.media),
    }
  }
  if (question?.gameType === 'majority-rules') {
    return {
      prompt: question.prompt || '',
      options: payload.options || ['', '', '', ''],
      explanation: question.explanation || '',
      media: cleanImageMedia(payload.media),
    }
  }
  if (question?.gameType === 'survey-showdown') {
    return {
      prompt: question.prompt || '',
      answers: payload.answers || [],
      explanation: question.explanation || '',
      media: cleanImageMedia(payload.media),
    }
  }
  if (question?.gameType === 'quickfire-30') {
    return { terms: payload.terms || ['', '', '', '', ''] }
  }
  if (question?.gameType === 'say-what-you-see') {
    return {
      answer: question.answer || '',
      acceptedAnswers: payload.acceptedAnswers || (question.answer ? [question.answer] : []),
      explanation: question.explanation || '',
      layout: payload.layout || 'square-one',
      tokens: payload.tokens || ['', ''],
      media: cleanImageMedia(payload.media),
    }
  }
  if (question?.gameType === 'word-wheel') {
    return {
      prompt: question.prompt || '',
    }
  }
  return {}
}

export function emptyQuestionForm(gameType) {
  return formFromQuestion({
    gameType,
    questionKind: GAME_QUESTION_BUILDERS[gameType]?.questionKind,
    payload: {},
  })
}

export function customOnlyReadiness(gameType, activeQuestions = []) {
  const minimum = GAME_QUESTION_BUILDERS[gameType]?.minimumActiveQuestions || 1
  const activeCount = activeQuestions.length
  if (gameType === 'million-ladder') {
    const coveredRungs = new Set(
      activeQuestions
        .map((question) => question?.payload?.rung ?? question?.rung)
        .filter((rung) => Number.isInteger(rung) && rung >= 0 && rung < 15),
    )
    return {
      ready: coveredRungs.size === 15,
      activeCount,
      minimumActiveQuestions: 15,
      missingRungs: Array.from({ length: 15 }, (_, index) => index + 1).filter(
        (rung) => !coveredRungs.has(rung - 1),
      ),
    }
  }
  return {
    ready: activeCount >= minimum,
    activeCount,
    minimumActiveQuestions: minimum,
    missingRungs: [],
  }
}
