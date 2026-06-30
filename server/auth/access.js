import { clerkClient, verifyToken } from '@clerk/express'
import { and, eq, gt, inArray, isNull, or } from 'drizzle-orm'
import { allowedOrigins } from '../config.js'
import { getDb, schema } from '../db/index.js'

export const FREE_DEMO_PRODUCT_KEY = 'free_demo'
export const DEMO_GAME_TYPES = ['majority-rules', 'million-ladder']

const paidPlanRank = {
  family_pack_v1: 1,
  custom_edition_v1: 2,
  club_pass_monthly: 3,
}

const activeEntitlementStatuses = ['active', 'trialing']
const localAuthorizedParties = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]

function authorizedParties() {
  return [...new Set([...allowedOrigins, ...localAuthorizedParties])]
}

function cleanToken(token) {
  const value = String(token || '').trim()
  if (!value) return ''
  return value.startsWith('Bearer ') ? value.slice(7).trim() : value
}

function sortedPlanKeys(planKeys) {
  return [...planKeys].sort((a, b) => (paidPlanRank[b] || 0) - (paidPlanRank[a] || 0))
}

function defaultAccess(clerkUserId = null) {
  return {
    clerkUserId,
    userId: null,
    productKey: FREE_DEMO_PRODUCT_KEY,
    paidPlanKeys: [],
    accessMode: 'demo',
    allowedGameTypes: DEMO_GAME_TYPES,
    hasFullAccess: false,
  }
}

async function verifyClerkToken(token) {
  const sessionToken = cleanToken(token)
  if (!sessionToken) return null
  if (!process.env.CLERK_SECRET_KEY) {
    console.warn('[auth] CLERK_SECRET_KEY is not configured; treating host as signed out.')
    return null
  }

  return verifyToken(sessionToken, {
    secretKey: process.env.CLERK_SECRET_KEY,
    authorizedParties: authorizedParties(),
  })
}

async function clerkUserProfile(clerkUserId) {
  if (!process.env.CLERK_SECRET_KEY) return {}
  try {
    const user = await clerkClient.users.getUser(clerkUserId)
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    )
    return {
      email: primaryEmail?.emailAddress || user.emailAddresses[0]?.emailAddress || null,
      displayName:
        user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
      imageUrl: user.imageUrl || null,
    }
  } catch (error) {
    console.warn('[auth] Could not load Clerk user profile.', error?.message || error)
    return {}
  }
}

async function upsertUser(clerkUserId) {
  if (!process.env.DATABASE_URL) return null

  const { users } = schema
  const profile = await clerkUserProfile(clerkUserId)
  const [user] = await getDb()
    .insert(users)
    .values({
      clerkUserId,
      email: profile.email || null,
      displayName: profile.displayName || null,
      imageUrl: profile.imageUrl || null,
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        email: profile.email || null,
        displayName: profile.displayName || null,
        imageUrl: profile.imageUrl || null,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id })

  return user?.id || null
}

async function paidAccessForUser(clerkUserId, userId) {
  if (!process.env.DATABASE_URL) return defaultAccess(clerkUserId)

  const { productGameGrants, products, userEntitlements } = schema
  const now = new Date()
  const rows = await getDb()
    .select({
      productKey: userEntitlements.productKey,
      gameType: productGameGrants.gameType,
    })
    .from(userEntitlements)
    .innerJoin(products, eq(userEntitlements.productKey, products.key))
    .innerJoin(productGameGrants, eq(productGameGrants.productKey, products.key))
    .where(
      and(
        eq(userEntitlements.clerkUserId, clerkUserId),
        inArray(userEntitlements.status, activeEntitlementStatuses),
        eq(products.status, 'active'),
        or(isNull(userEntitlements.expiresAt), gt(userEntitlements.expiresAt, now)),
      ),
    )

  const paidPlanKeys = sortedPlanKeys(new Set(rows.map((row) => row.productKey)))
  if (!paidPlanKeys.length) return { ...defaultAccess(clerkUserId), userId }

  return {
    clerkUserId,
    userId,
    productKey: paidPlanKeys[0],
    paidPlanKeys,
    accessMode: 'full',
    allowedGameTypes: [...new Set(rows.map((row) => row.gameType))],
    hasFullAccess: true,
  }
}

export async function resolveAccessFromToken(token) {
  const claims = await verifyClerkToken(token)
  const clerkUserId = claims?.sub
  if (!clerkUserId) return defaultAccess()

  const userId = await upsertUser(clerkUserId)
  return paidAccessForUser(clerkUserId, userId)
}

export async function resolveHostGameAccess({ token, gameType }) {
  const access = await resolveAccessFromToken(token)
  if (access.allowedGameTypes.includes(gameType)) {
    return { ok: true, ...access }
  }

  if (access.clerkUserId) {
    return {
      ok: false,
      code: 'purchase_required',
      error: 'Purchase a pack to host that game.',
      ...access,
    }
  }

  return {
    ok: false,
    code: 'demo_only',
    error: 'The free demo includes Majority Rules and Million Ladder.',
    ...access,
  }
}
