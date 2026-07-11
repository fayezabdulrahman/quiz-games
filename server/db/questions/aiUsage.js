import { sql } from 'drizzle-orm'
import { getDb } from '../index.js'

export function aiDailyLimit() {
  const configured = Number(process.env.AI_QUESTION_DAILY_LIMIT || 10)
  return Number.isInteger(configured) && configured > 0 ? configured : 10
}

export async function successfulGenerationsToday(userId) {
  const result = await getDb().execute(sql`
    SELECT generation_count
    FROM ai_question_usage
    WHERE user_id = ${userId} AND usage_date = CURRENT_DATE
  `)
  return Number(result.rows?.[0]?.generation_count || 0)
}

export async function recordSuccessfulGeneration(userId) {
  const limit = aiDailyLimit()
  const result = await getDb().execute(sql`
    INSERT INTO ai_question_usage (user_id, usage_date, generation_count, updated_at)
    VALUES (${userId}, CURRENT_DATE, 1, NOW())
    ON CONFLICT (user_id, usage_date) DO UPDATE
    SET generation_count = ai_question_usage.generation_count + 1, updated_at = NOW()
    WHERE ai_question_usage.generation_count < ${limit}
    RETURNING generation_count
  `)
  const count = Number(result.rows?.[0]?.generation_count || 0)
  return count ? { allowed: true, used: count, limit } : { allowed: false, used: limit, limit }
}
