import { relations } from 'drizzle-orm'
import {
  productFeatureGrants,
  productGameGrants,
  products,
  stripeCheckoutSessions,
  stripeCustomers,
  stripeSubscriptions,
  userEntitlements,
} from './billing.js'
import { questionSets, questions, userGameContentPreferences } from './customQuestions.js'
import { users } from './users.js'

export const usersRelations = relations(users, ({ many, one }) => ({
  stripeCustomer: one(stripeCustomers),
  entitlements: many(userEntitlements),
  subscriptions: many(stripeSubscriptions),
  checkoutSessions: many(stripeCheckoutSessions),
  questionSets: many(questionSets),
  questions: many(questions),
  gameContentPreferences: many(userGameContentPreferences),
}))

export const productsRelations = relations(products, ({ many }) => ({
  gameGrants: many(productGameGrants),
  featureGrants: many(productFeatureGrants),
  entitlements: many(userEntitlements),
}))

export const productGameGrantsRelations = relations(productGameGrants, ({ one }) => ({
  product: one(products, {
    fields: [productGameGrants.productKey],
    references: [products.key],
  }),
}))

export const productFeatureGrantsRelations = relations(productFeatureGrants, ({ one }) => ({
  product: one(products, {
    fields: [productFeatureGrants.productKey],
    references: [products.key],
  }),
}))

export const stripeCustomersRelations = relations(stripeCustomers, ({ one }) => ({
  user: one(users, {
    fields: [stripeCustomers.userId],
    references: [users.id],
  }),
}))

export const userEntitlementsRelations = relations(userEntitlements, ({ one, many }) => ({
  user: one(users, {
    fields: [userEntitlements.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [userEntitlements.productKey],
    references: [products.key],
  }),
  subscriptions: many(stripeSubscriptions),
}))

export const stripeSubscriptionsRelations = relations(stripeSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [stripeSubscriptions.userId],
    references: [users.id],
  }),
  entitlement: one(userEntitlements, {
    fields: [stripeSubscriptions.entitlementId],
    references: [userEntitlements.id],
  }),
}))

export const stripeCheckoutSessionsRelations = relations(stripeCheckoutSessions, ({ one }) => ({
  user: one(users, {
    fields: [stripeCheckoutSessions.userId],
    references: [users.id],
  }),
}))

export const questionSetsRelations = relations(questionSets, ({ one, many }) => ({
  owner: one(users, {
    fields: [questionSets.ownerUserId],
    references: [users.id],
  }),
  questions: many(questions),
}))

export const questionsRelations = relations(questions, ({ one }) => ({
  owner: one(users, {
    fields: [questions.ownerUserId],
    references: [users.id],
  }),
  questionSet: one(questionSets, {
    fields: [questions.questionSetId],
    references: [questionSets.id],
  }),
}))

export const userGameContentPreferencesRelations = relations(
  userGameContentPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userGameContentPreferences.userId],
      references: [users.id],
    }),
    preferredQuestionSet: one(questionSets, {
      fields: [userGameContentPreferences.preferredQuestionSetId],
      references: [questionSets.id],
    }),
  })
)
