const localClientOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']

const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const allowedOrigins =
  configuredOrigins.length > 0 ? [...configuredOrigins, ...localClientOrigins] : []
export const corsOrigin = allowedOrigins.length > 0 ? allowedOrigins : true
export const questionDurationMs = Number(process.env.QUESTION_TIME_MS || 30_000)
export const gameTypes = new Set([
  'one-percent',
  'majority-rules',
  'bluff-battle',
  'million-ladder',
  'survey-showdown',
  'quickfire-30',
  'say-what-you-see',
])
