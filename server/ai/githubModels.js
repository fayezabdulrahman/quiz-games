import OpenAI from 'openai'
import { buildGenerationMessages, validateGeneratedForm } from './questionGenerationSpecs.js'

let client

function providerClient() {
  const apiKey = process.env.GITHUB_MODELS_TOKEN?.trim()
  if (!apiKey) throw Object.assign(new Error('AI question generation is not configured yet.'), { status: 503 })
  client ||= new OpenAI({
    apiKey,
    baseURL: process.env.GITHUB_MODELS_ENDPOINT?.trim() || 'https://models.github.ai/inference',
    timeout: 30_000,
    maxRetries: 1,
  })
  return client
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
    const response = await providerClient().chat.completions.create({
      model: process.env.GITHUB_MODELS_MODEL?.trim() || 'openai/gpt-4.1-mini',
      messages: buildGenerationMessages(gameType, topic),
      response_format: { type: 'json_object' },
    })
    return validateGeneratedForm(gameType, parseJson(response.choices?.[0]?.message?.content))
  } catch (error) {
    if (error?.status === 429) throw Object.assign(new Error('The AI service quota is busy or exhausted. Please try again later.'), { status: 429 })
    if (error?.status === 401 || error?.status === 403) throw Object.assign(new Error('The AI service credentials were rejected.'), { status: 503 })
    if (error?.code === 'ETIMEDOUT' || error?.name === 'APIConnectionTimeoutError') throw Object.assign(new Error('The AI service took too long to respond.'), { status: 504 })
    throw error
  }
}
