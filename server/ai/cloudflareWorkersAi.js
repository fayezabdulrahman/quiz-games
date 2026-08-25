import OpenAI from 'openai'
import { buildGenerationMessages, validateGeneratedForm } from './questionGenerationSpecs.js'

let client

function cloudflareConfig() {
  const apiKey = process.env.CLOUDFLARE_AI_API_TOKEN?.trim()
  const accountId = process.env.CLOUDFLARE_AI_ACCOUNT_ID?.trim()
  if (!apiKey || !accountId) {
    throw Object.assign(new Error('AI question generation is not configured yet.'), { status: 503 })
  }
  return {
    apiKey,
    accountId,
    model:
      process.env.CLOUDFLARE_AI_MODEL?.trim() ||
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  }
}

export function assertQuestionGenerationConfigured() {
  cloudflareConfig()
}

function providerClient(config) {
  client ||= new OpenAI({
    apiKey: config.apiKey,
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/v1`,
    timeout: 30_000,
    maxRetries: 1,
  })
  return client
}

function maxOutputTokens() {
  const configured = Number.parseInt(process.env.AI_QUESTION_MAX_OUTPUT_TOKENS || '', 10)
  return Number.isInteger(configured) && configured >= 100 && configured <= 2_000
    ? configured
    : 500
}

function parseJson(content) {
  try {
    return JSON.parse(String(content || '').trim())
  } catch {
    throw Object.assign(new Error('The AI returned an unreadable question. Please try again.'), { status: 502 })
  }
}

export async function generateQuestionForm({ gameType, topic }) {
  try {
    const config = cloudflareConfig()
    const response = await providerClient(config).chat.completions.create({
      model: config.model,
      messages: buildGenerationMessages(gameType, topic),
      response_format: { type: 'json_object' },
      max_tokens: maxOutputTokens(),
    })
    return validateGeneratedForm(gameType, parseJson(response.choices?.[0]?.message?.content))
  } catch (error) {
    if (error?.status === 429) {
      throw Object.assign(
        new Error('The AI question allowance is temporarily exhausted. Please try again later.'),
        { status: 429 },
      )
    }
    if (error?.status === 401 || error?.status === 403) throw Object.assign(new Error('The AI service credentials were rejected.'), { status: 503 })
    if (error?.code === 'ETIMEDOUT' || error?.name === 'APIConnectionTimeoutError') throw Object.assign(new Error('The AI service took too long to respond.'), { status: 504 })
    throw error
  }
}
