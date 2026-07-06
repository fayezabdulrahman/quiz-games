import { apiUrl } from './api.js'

async function readJson(response) {
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json() : {}
  if (!response.ok || body?.ok === false) {
    throw new Error(body?.error || 'Could not save custom content.')
  }
  return body
}

export async function contentRequest(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })
  return readJson(response)
}

export function contentOptionsPath(gameType) {
  return `/api/me/content-options?gameType=${encodeURIComponent(gameType)}`
}

export function questionPacksPath(gameType) {
  return gameType
    ? `/api/me/question-packs?gameType=${encodeURIComponent(gameType)}`
    : '/api/me/question-packs'
}
