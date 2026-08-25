import { sql } from 'drizzle-orm'
import { getDb } from '../index.js'

export function aiDailyLimit() {
  const configured = Number(process.env.AI_QUESTION_DAILY_LIMIT || 5)
  return Number.isInteger(configured) && configured > 0 ? configured : 5
}

export function aiGlobalDailyLimit() {
  const configured = Number(process.env.AI_QUESTION_GLOBAL_DAILY_LIMIT || 200)
  return Number.isInteger(configured) && configured > 0 ? configured : 200
}

export async function reserveGenerationAttempt(userId) {
  const userLimit = aiDailyLimit()
  const globalLimit = aiGlobalDailyLimit()
  const result = await getDb().execute(sql`
    WITH quota_lock AS (
      SELECT pg_advisory_xact_lock(73190427)
    ),
    daily_total AS (
      SELECT COALESCE(SUM(usage.generation_count), 0)::integer AS generation_count
      FROM ai_question_usage AS usage
      CROSS JOIN quota_lock
      WHERE usage.usage_date = CURRENT_DATE
    ),
    reserved AS (
      INSERT INTO ai_question_usage (user_id, usage_date, generation_count, updated_at)
      SELECT ${userId}, CURRENT_DATE, 1, NOW()
      FROM daily_total
      WHERE daily_total.generation_count < ${globalLimit}
      ON CONFLICT (user_id, usage_date) DO UPDATE
      SET
        generation_count = ai_question_usage.generation_count + 1,
        updated_at = NOW()
      WHERE ai_question_usage.generation_count < ${userLimit}
      RETURNING generation_count
    )
    SELECT
      COALESCE((SELECT generation_count FROM reserved), 0)::integer AS user_count,
      (
        (SELECT generation_count FROM daily_total) +
        CASE WHEN EXISTS (SELECT 1 FROM reserved) THEN 1 ELSE 0 END
      )::integer AS global_count
  `)
  const userCount = Number(result.rows?.[0]?.user_count || 0)
  const globalCount = Number(result.rows?.[0]?.global_count || 0)

  if (userCount > 0) {
    return {
      allowed: true,
      used: userCount,
      limit: userLimit,
      globalUsed: globalCount,
      globalLimit,
    }
  }
  return {
    allowed: false,
    reason: globalCount >= globalLimit ? 'global_limit' : 'user_limit',
    used: userLimit,
    limit: userLimit,
    globalUsed: globalCount,
    globalLimit,
  }
}
