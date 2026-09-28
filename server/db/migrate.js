import 'dotenv/config'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required before database migrations can run.')
}

const db = drizzle(process.env.DATABASE_URL)

await migrate(db, { migrationsFolder: './drizzle' })

console.log('Database migrations applied successfully.')
