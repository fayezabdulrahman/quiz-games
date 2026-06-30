import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema/index.js'

let db

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required before the database can be used.')
  }

  if (!db) {
    const client = neon(process.env.DATABASE_URL)
    db = drizzle(client, { schema })
  }

  return db
}

export { schema }
