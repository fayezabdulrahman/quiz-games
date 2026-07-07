import crypto from 'node:crypto'
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const IMAGE_TYPES = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
])

const MAX_DELETE_KEYS = 1000

function cleanBaseUrl(value) {
  return String(value || '').trim().replace(/\/$/, '')
}

function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucketName = process.env.R2_BUCKET_NAME?.trim()
  const publicBaseUrl = cleanBaseUrl(process.env.R2_PUBLIC_BASE_URL)

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicBaseUrl) {
    return null
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl,
  }
}

function getClient(config) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
}

function requireR2Config() {
  const config = r2Config()
  if (!config) {
    const error = new Error('Cloudflare R2 is not configured for uploads.')
    error.status = 503
    throw error
  }
  return config
}

export function isSupportedImageType(mimeType) {
  return IMAGE_TYPES.has(mimeType)
}

export function assertOwnedStorageKey(access, storageKey) {
  const key = String(storageKey || '').trim()
  const userId = String(access?.userId || '').trim()
  const prefix = userId ? `custom-questions/${userId}/` : ''
  return Boolean(prefix && key.startsWith(prefix) && !key.includes('..'))
}

export function mediaStorageKeys(media = []) {
  return Array.from(
    new Set(
      (Array.isArray(media) ? media : [])
        .map((item) => String(item?.storageKey || '').trim())
        .filter(Boolean),
    ),
  )
}

export async function uploadQuestionImage(access, file) {
  const config = requireR2Config()
  if (!file || !file.buffer?.length) {
    const error = new Error('Choose an image to upload.')
    error.status = 400
    throw error
  }
  if (!isSupportedImageType(file.mimetype)) {
    const error = new Error('Images must be PNG, JPEG, WebP, or GIF.')
    error.status = 400
    throw error
  }

  const extension = IMAGE_TYPES.get(file.mimetype)
  const key = `custom-questions/${access.userId}/${crypto.randomUUID()}.${extension}`
  const client = getClient(config)

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )

  return {
    type: 'image',
    src: `${config.publicBaseUrl}/${key}`,
    storageKey: key,
    alt: file.originalname || 'Question image',
  }
}

export async function deleteQuestionImages(access, storageKeys = []) {
  const config = r2Config()
  if (!config) return { deleted: 0, skipped: storageKeys.length }

  const keys = Array.from(new Set(storageKeys.filter((key) => assertOwnedStorageKey(access, key))))
  if (!keys.length) return { deleted: 0, skipped: storageKeys.length }

  const client = getClient(config)
  let deleted = 0

  for (let index = 0; index < keys.length; index += MAX_DELETE_KEYS) {
    const chunk = keys.slice(index, index + MAX_DELETE_KEYS)
    await client.send(
      new DeleteObjectsCommand({
        Bucket: config.bucketName,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    )
    deleted += chunk.length
  }

  return { deleted, skipped: storageKeys.length - keys.length }
}

export async function cleanupQuestionImages(access, storageKeys = []) {
  try {
    return await deleteQuestionImages(access, storageKeys)
  } catch (error) {
    console.error('[r2] Failed to delete question images', error)
    return { deleted: 0, skipped: storageKeys.length, error }
  }
}
