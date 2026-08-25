function positiveInteger(value, fallback, { max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isInteger(parsed) && parsed > 0 && parsed <= max ? parsed : fallback
}

export function createGenerationGuard({
  maxConcurrent = 2,
  requestsPerMinute = 10,
  now = () => Date.now(),
} = {}) {
  let activeCount = 0
  const activeUsers = new Set()
  const recentStarts = []

  function prune(timestamp) {
    const cutoff = timestamp - 60_000
    while (recentStarts.length > 0 && recentStarts[0].timestamp <= cutoff) recentStarts.shift()
  }

  return {
    tryAcquire(userId) {
      const timestamp = now()
      prune(timestamp)

      if (activeUsers.has(userId)) {
        return {
          allowed: false,
          reason: 'user_busy',
          retryAfterSeconds: 2,
        }
      }
      if (activeCount >= maxConcurrent) {
        return {
          allowed: false,
          reason: 'service_busy',
          retryAfterSeconds: 3,
        }
      }
      if (recentStarts.length >= requestsPerMinute) {
        const retryAfterMs = Math.max(1_000, recentStarts[0].timestamp + 60_000 - timestamp)
        return {
          allowed: false,
          reason: 'minute_limit',
          retryAfterSeconds: Math.ceil(retryAfterMs / 1_000),
        }
      }

      activeCount += 1
      activeUsers.add(userId)
      const rateEntry = { timestamp }
      recentStarts.push(rateEntry)
      let released = false

      function release() {
        if (released) return
        released = true
        activeCount = Math.max(0, activeCount - 1)
        activeUsers.delete(userId)
      }

      return {
        allowed: true,
        cancel() {
          const index = recentStarts.indexOf(rateEntry)
          if (index >= 0) recentStarts.splice(index, 1)
          release()
        },
        release,
      }
    },
  }
}

const generationGuard = createGenerationGuard({
  maxConcurrent: positiveInteger(process.env.AI_QUESTION_MAX_CONCURRENT, 2, { max: 10 }),
  requestsPerMinute: positiveInteger(process.env.AI_QUESTION_GLOBAL_MINUTE_LIMIT, 10, {
    max: 1_000,
  }),
})

export function tryAcquireGenerationSlot(userId) {
  return generationGuard.tryAcquire(userId)
}
