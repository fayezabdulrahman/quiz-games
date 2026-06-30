import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import {
  entitlementSourceEnum,
  entitlementStatusEnum,
  featureKeyEnum,
  gameTypeEnum,
  productBillingTypeEnum,
  productStatusEnum,
} from './enums.js'
import { users } from './users.js'

export const products = pgTable(
  'products',
  {
    key: varchar('key', { length: 120 }).primaryKey(),
    name: varchar('name', { length: 160 }).notNull(),
    description: text('description'),
    billingType: productBillingTypeEnum('billing_type').notNull(),
    status: productStatusEnum('status').notNull().default('draft'),
    requiresUser: boolean('requires_user').notNull().default(true),
    requiresEntitlement: boolean('requires_entitlement').notNull().default(true),
    priceCents: integer('price_cents'),
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    stripeProductId: varchar('stripe_product_id', { length: 255 }),
    stripePriceId: varchar('stripe_price_id', { length: 255 }),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('products_status_idx').on(table.status),
    billingTypeIdx: index('products_billing_type_idx').on(table.billingType),
    stripeProductIdIdx: uniqueIndex('products_stripe_product_id_idx').on(table.stripeProductId),
    stripePriceIdIdx: uniqueIndex('products_stripe_price_id_idx').on(table.stripePriceId),
  })
)

export const productGameGrants = pgTable(
  'product_game_grants',
  {
    productKey: varchar('product_key', { length: 120 })
      .notNull()
      .references(() => products.key, { onDelete: 'cascade' }),
    gameType: gameTypeEnum('game_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.productKey, table.gameType] }),
    gameTypeIdx: index('product_game_grants_game_type_idx').on(table.gameType),
  })
)

export const productFeatureGrants = pgTable(
  'product_feature_grants',
  {
    productKey: varchar('product_key', { length: 120 })
      .notNull()
      .references(() => products.key, { onDelete: 'cascade' }),
    featureKey: featureKeyEnum('feature_key').notNull(),
    limit: integer('limit'),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.productKey, table.featureKey] }),
    featureKeyIdx: index('product_feature_grants_feature_key_idx').on(table.featureKey),
  })
)

export const stripeCustomers = pgTable(
  'stripe_customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clerkUserId: varchar('clerk_user_id', { length: 191 }).notNull(),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).notNull(),
    email: varchar('email', { length: 320 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('stripe_customers_user_id_idx').on(table.userId),
    clerkUserIdIdx: index('stripe_customers_clerk_user_id_idx').on(table.clerkUserId),
    stripeCustomerIdIdx: uniqueIndex('stripe_customers_stripe_customer_id_idx').on(
      table.stripeCustomerId
    ),
  })
)

export const userEntitlements = pgTable(
  'user_entitlements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clerkUserId: varchar('clerk_user_id', { length: 191 }).notNull(),
    productKey: varchar('product_key', { length: 120 })
      .notNull()
      .references(() => products.key, { onDelete: 'restrict' }),
    status: entitlementStatusEnum('status').notNull().default('trialing'),
    source: entitlementSourceEnum('source').notNull().default('manual'),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    stripePriceId: varchar('stripe_price_id', { length: 255 }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userProductIdx: uniqueIndex('user_entitlements_user_product_idx').on(
      table.userId,
      table.productKey
    ),
    productKeyIdx: index('user_entitlements_product_key_idx').on(table.productKey),
    clerkUserIdIdx: index('user_entitlements_clerk_user_id_idx').on(table.clerkUserId),
    statusIdx: index('user_entitlements_status_idx').on(table.status),
    stripeSubscriptionIdIdx: uniqueIndex('user_entitlements_stripe_subscription_id_idx').on(
      table.stripeSubscriptionId
    ),
  })
)

export const stripeSubscriptions = pgTable(
  'stripe_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entitlementId: uuid('entitlement_id').references(() => userEntitlements.id, {
      onDelete: 'set null',
    }),
    clerkUserId: varchar('clerk_user_id', { length: 191 }).notNull(),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).notNull(),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).notNull(),
    stripePriceId: varchar('stripe_price_id', { length: 255 }),
    stripeProductId: varchar('stripe_product_id', { length: 255 }),
    status: varchar('status', { length: 80 }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    rawEvent: jsonb('raw_event').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    stripeSubscriptionIdIdx: uniqueIndex('stripe_subscriptions_stripe_subscription_id_idx').on(
      table.stripeSubscriptionId
    ),
    userIdIdx: index('stripe_subscriptions_user_id_idx').on(table.userId),
    clerkUserIdIdx: index('stripe_subscriptions_clerk_user_id_idx').on(table.clerkUserId),
    statusIdx: index('stripe_subscriptions_status_idx').on(table.status),
  })
)

export const stripeCheckoutSessions = pgTable(
  'stripe_checkout_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clerkUserId: varchar('clerk_user_id', { length: 191 }).notNull(),
    stripeCheckoutSessionId: varchar('stripe_checkout_session_id', { length: 255 }).notNull(),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    mode: varchar('mode', { length: 40 }),
    paymentStatus: varchar('payment_status', { length: 80 }),
    status: varchar('status', { length: 80 }),
    rawEvent: jsonb('raw_event').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    stripeCheckoutSessionIdIdx: uniqueIndex(
      'stripe_checkout_sessions_stripe_checkout_session_id_idx'
    ).on(table.stripeCheckoutSessionId),
    userIdIdx: index('stripe_checkout_sessions_user_id_idx').on(table.userId),
    clerkUserIdIdx: index('stripe_checkout_sessions_clerk_user_id_idx').on(table.clerkUserId),
  })
)
