import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { and, eq, notInArray, sql } from 'drizzle-orm'
import { getDb, schema } from './index.js'
import { officialQuestionSets } from './catalog/officialQuestionCatalog.js'
import { pricingTiers } from './catalog/pricingTiers.js'

const {
  productFeatureGrants,
  productGameGrants,
  products,
  questionSets,
  questions,
} = schema

const requiredTables = ['products', 'product_game_grants', 'product_feature_grants', 'question_sets', 'questions']

function now() {
  return new Date()
}

async function seedProducts(db) {
  let productCount = 0
  let gameGrantCount = 0
  let featureGrantCount = 0

  for (const tier of pricingTiers) {
    await db
      .insert(products)
      .values({
        key: tier.key,
        name: tier.name,
        billingType: tier.billingType,
        status: tier.status,
        requiresUser: tier.requiresUser,
        requiresEntitlement: tier.requiresEntitlement,
        priceCents: tier.priceCents,
        currency: tier.currency,
        metadata: tier.metadata,
      })
      .onConflictDoUpdate({
        target: products.key,
        set: {
          name: tier.name,
          billingType: tier.billingType,
          status: tier.status,
          requiresUser: tier.requiresUser,
          requiresEntitlement: tier.requiresEntitlement,
          priceCents: tier.priceCents,
          currency: tier.currency,
          metadata: tier.metadata,
          updatedAt: now(),
        },
      })
    productCount += 1

    await db
      .delete(productGameGrants)
      .where(
        and(
          eq(productGameGrants.productKey, tier.key),
          notInArray(productGameGrants.gameType, tier.gameGrants),
        ),
      )

    for (const gameType of tier.gameGrants) {
      await db
        .insert(productGameGrants)
        .values({ productKey: tier.key, gameType })
        .onConflictDoNothing({
          target: [productGameGrants.productKey, productGameGrants.gameType],
        })
      gameGrantCount += 1
    }

    const featureKeys = tier.featureGrants.map((grant) => grant.featureKey)
    await db
      .delete(productFeatureGrants)
      .where(
        and(
          eq(productFeatureGrants.productKey, tier.key),
          notInArray(productFeatureGrants.featureKey, featureKeys),
        ),
      )

    for (const grant of tier.featureGrants) {
      await db
        .insert(productFeatureGrants)
        .values({
          productKey: tier.key,
          featureKey: grant.featureKey,
          limit: grant.limit ?? null,
          metadata: grant.metadata || {},
        })
        .onConflictDoUpdate({
          target: [productFeatureGrants.productKey, productFeatureGrants.featureKey],
          set: {
            limit: grant.limit ?? null,
            metadata: grant.metadata || {},
          },
        })
      featureGrantCount += 1
    }
  }

  return { productCount, gameGrantCount, featureGrantCount }
}

async function seedOfficialQuestions(db) {
  let questionSetCount = 0
  let questionCount = 0

  for (const officialSet of officialQuestionSets) {
    const [questionSet] = await db
      .insert(questionSets)
      .values({
        source: officialSet.source,
        ownerUserId: null,
        ownerClerkUserId: null,
        gameType: officialSet.gameType,
        slug: officialSet.slug,
        title: officialSet.title,
        description: officialSet.description || null,
        status: officialSet.status,
        isDefaultForGame: officialSet.isDefaultForGame,
        settings: officialSet.settings || {},
      })
      .onConflictDoUpdate({
        target: [questionSets.source, questionSets.gameType, questionSets.slug],
        set: {
          title: officialSet.title,
          description: officialSet.description || null,
          status: officialSet.status,
          isDefaultForGame: officialSet.isDefaultForGame,
          settings: officialSet.settings || {},
          updatedAt: now(),
        },
      })
      .returning({ id: questionSets.id })
    questionSetCount += 1

    for (const question of officialSet.questions) {
      await db
        .insert(questions)
        .values({
          questionSetId: questionSet.id,
          source: question.source,
          ownerUserId: null,
          ownerClerkUserId: null,
          gameType: question.gameType,
          externalId: question.externalId,
          status: question.status,
          questionKind: question.questionKind,
          schemaVersion: question.schemaVersion,
          prompt: question.prompt,
          answer: question.answer,
          explanation: question.explanation,
          difficulty: question.difficulty,
          sortOrder: question.sortOrder || 0,
          payload: question.payload,
        })
        .onConflictDoUpdate({
          target: [questions.questionSetId, questions.externalId],
          set: {
            source: question.source,
            gameType: question.gameType,
            status: question.status,
            questionKind: question.questionKind,
            schemaVersion: question.schemaVersion,
            prompt: question.prompt,
            answer: question.answer,
            explanation: question.explanation,
            difficulty: question.difficulty,
            sortOrder: question.sortOrder || 0,
            payload: question.payload,
            updatedAt: now(),
          },
        })
      questionCount += 1
    }
  }

  return { questionSetCount, questionCount }
}

export async function seedDatabase() {
  const db = getDb()
  const existingTables = await db.execute(sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
  `)
  const existingTableRows = Array.isArray(existingTables) ? existingTables : existingTables.rows
  const tableNames = new Set(existingTableRows.map((row) => row.table_name))
  const missingTables = requiredTables.filter((table) => !tableNames.has(table))

  if (missingTables.length) {
    throw new Error(
      `Database schema is missing required tables: ${missingTables.join(', ')}. Run npm run db:check to inspect the DATABASE_URL target, then apply the latest migration before seeding.`
    )
  }

  const productResult = await seedProducts(db)
  const questionResult = await seedOfficialQuestions(db)

  return {
    ...productResult,
    ...questionResult,
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then((result) => {
      console.log('Database seed complete')
      console.table(result)
    })
    .catch((error) => {
      console.error('Database seed failed')
      console.error(error)
      process.exitCode = 1
    })
}
