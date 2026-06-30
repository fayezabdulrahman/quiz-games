import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { fileURLToPath } from 'node:url'

const expectedTables = [
  'products',
  'product_game_grants',
  'product_feature_grants',
  'users',
  'user_entitlements',
  'question_sets',
  'questions',
  'user_game_content_preferences',
]

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required before checking the database schema.')
  }

  const sql = neon(process.env.DATABASE_URL)
  const rows = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `
  const types = await sql`
    select t.typname as type_name
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typtype = 'e'
    order by t.typname
  `
  const existingTables = new Set(rows.map((row) => row.table_name))
  const missingTables = expectedTables.filter((table) => !existingTables.has(table))

  console.log(`Found ${rows.length} public tables:`)
  console.log(rows.map((row) => `- ${row.table_name}`).join('\n') || '(none)')

  console.log(`\nFound ${types.length} public enum types:`)
  console.log(types.map((row) => `- ${row.type_name}`).join('\n') || '(none)')

  if (missingTables.length) {
    console.log('\nMissing tables needed by the current seed script:')
    console.log(missingTables.map((table) => `- ${table}`).join('\n'))
    if (types.length) {
      console.log('\nExisting enum types may also block a fresh initial migration.')
    }
    process.exitCode = 1
    return
  }

  console.log('\nSchema check passed.')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('Schema check failed')
    console.error(error)
    process.exitCode = 1
  })
}
