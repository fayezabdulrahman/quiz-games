import { pgEnum } from 'drizzle-orm/pg-core'

export const gameTypeEnum = pgEnum('game_type', [
  'one-percent',
  'majority-rules',
  'bluff-battle',
  'million-ladder',
  'survey-showdown',
  'quickfire-30',
  'say-what-you-see',
])

export const entitlementStatusEnum = pgEnum('entitlement_status', [
  'trialing',
  'active',
  'past_due',
  'paused',
  'cancelled',
  'expired',
])

export const entitlementSourceEnum = pgEnum('entitlement_source', [
  'manual',
  'stripe_subscription',
  'stripe_checkout',
  'promo',
])

export const productBillingTypeEnum = pgEnum('product_billing_type', [
  'free',
  'one_time',
  'subscription',
])

export const productStatusEnum = pgEnum('product_status', [
  'draft',
  'active',
  'archived',
])

export const featureKeyEnum = pgEnum('feature_key', [
  'host_games',
  'room_size_cap',
  'built_in_question_pools',
  'custom_questions',
  'custom_question_import',
  'reusable_custom_packs',
  'new_games',
  'official_question_packs',
  'seasonal_question_packs',
  'topical_question_packs',
  'early_access',
])

export const questionSetStatusEnum = pgEnum('question_set_status', [
  'draft',
  'active',
  'archived',
])

export const questionSourceEnum = pgEnum('question_source', [
  'official',
  'user',
])

export const contentSelectionModeEnum = pgEnum('content_selection_mode', [
  'official',
  'mixed',
  'user_only',
])

export const questionStatusEnum = pgEnum('question_status', [
  'draft',
  'active',
  'archived',
])
