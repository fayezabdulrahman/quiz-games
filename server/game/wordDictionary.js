import { eq, sql } from 'drizzle-orm'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb, schema } from '../db/index.js'

const dictionaryPath = join(dirname(fileURLToPath(import.meta.url)), 'wordWheelBaseWords.txt')
const baseWords = new Set(
  readFileSync(dictionaryPath, 'utf8')
    .split(/\r?\n/)
    .map((word) => word.trim())
    .filter((word) => word && !word.startsWith('#')),
)

let approvedDbWordsCache = null
let approvedDbWordsCachePromise = null

export function normalizeDictionaryWord(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z\s'-]/g, ' ')
    .replace(/[-']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

export function wordTokens(value = '') {
  return normalizeDictionaryWord(value).split(' ').filter(Boolean)
}

export function firstLetterForWord(value = '') {
  return wordTokens(value)[0]?.[0]?.toUpperCase() || ''
}

function baseDictionaryHas(normalizedWord) {
  const tokens = wordTokens(normalizedWord)
  return tokens.length > 0 && tokens.every((token) => baseWords.has(token))
}

async function loadApprovedDbWords() {
  if (!process.env.DATABASE_URL) return new Set()
  if (approvedDbWordsCache) return approvedDbWordsCache
  if (approvedDbWordsCachePromise) return approvedDbWordsCachePromise

  approvedDbWordsCachePromise = (async () => {
    const { wordDictionaryEntries } = schema
    const rows = await getDb()
      .select({ normalizedWord: wordDictionaryEntries.normalizedWord })
      .from(wordDictionaryEntries)
      .where(eq(wordDictionaryEntries.status, 'approved'))
    approvedDbWordsCache = new Set(rows.map((row) => row.normalizedWord))
    approvedDbWordsCachePromise = null
    return approvedDbWordsCache
  })()

  return approvedDbWordsCachePromise
}

async function approvedWordInDb(normalizedWord) {
  if (!process.env.DATABASE_URL) return false
  try {
    return (await loadApprovedDbWords()).has(normalizedWord)
  } catch (error) {
    console.warn('[word-wheel] Could not check DB dictionary.', error?.message || error)
    return false
  }
}

export async function refreshApprovedDictionaryCache() {
  approvedDbWordsCache = null
  approvedDbWordsCachePromise = null
  return loadApprovedDbWords()
}

export async function dictionaryStatusForWord(word) {
  const normalizedWord = normalizeDictionaryWord(word)
  if (!normalizedWord) return { status: 'invalid', normalizedWord }
  if (baseDictionaryHas(normalizedWord)) return { status: 'recognized', normalizedWord }
  if (await approvedWordInDb(normalizedWord)) return { status: 'recognized', normalizedWord }
  return { status: 'unrecognized', normalizedWord }
}

export async function approveDictionaryWord({
  word,
  normalizedWord = normalizeDictionaryWord(word),
  acceptedByUserId,
  acceptedByClerkUserId,
  gameType = 'word-wheel',
} = {}) {
  if (!process.env.DATABASE_URL || !normalizedWord) return false

  try {
    const { wordDictionaryEntries } = schema
    await getDb()
      .insert(wordDictionaryEntries)
      .values({
        word: String(word || normalizedWord).trim().slice(0, 120),
        normalizedWord,
        status: 'approved',
        source: 'host_accepted',
        acceptedByUserId: acceptedByUserId || null,
        acceptedByClerkUserId: acceptedByClerkUserId || null,
        firstSeenGameType: gameType,
        timesAccepted: 1,
      })
      .onConflictDoUpdate({
        target: wordDictionaryEntries.normalizedWord,
        set: {
          status: 'approved',
          source: 'host_accepted',
          word: String(word || normalizedWord).trim().slice(0, 120),
          acceptedByUserId: acceptedByUserId || null,
          acceptedByClerkUserId: acceptedByClerkUserId || null,
          firstSeenGameType: gameType,
          timesAccepted: sql`${wordDictionaryEntries.timesAccepted} + 1`,
          updatedAt: new Date(),
        },
      })
    await refreshApprovedDictionaryCache()
    return true
  } catch (error) {
    console.warn('[word-wheel] Could not approve dictionary word.', error?.message || error)
    return false
  }
}
