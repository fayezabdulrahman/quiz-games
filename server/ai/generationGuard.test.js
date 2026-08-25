import assert from 'node:assert/strict'
import test from 'node:test'
import { createGenerationGuard } from './generationGuard.js'

test('limits concurrent requests and prevents duplicate in-flight requests per user', () => {
  const guard = createGenerationGuard({ maxConcurrent: 2, requestsPerMinute: 10 })
  const first = guard.tryAcquire('user-1')
  const second = guard.tryAcquire('user-2')

  assert.equal(first.allowed, true)
  assert.equal(second.allowed, true)
  assert.equal(guard.tryAcquire('user-1').reason, 'user_busy')
  assert.equal(guard.tryAcquire('user-3').reason, 'service_busy')

  first.release()
  assert.equal(guard.tryAcquire('user-3').allowed, true)
  second.release()
})

test('enforces the rolling per-minute request limit', () => {
  let timestamp = 1_000_000
  const guard = createGenerationGuard({
    maxConcurrent: 2,
    requestsPerMinute: 2,
    now: () => timestamp,
  })

  const first = guard.tryAcquire('user-1')
  first.release()
  const second = guard.tryAcquire('user-2')
  second.release()

  const blocked = guard.tryAcquire('user-3')
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.reason, 'minute_limit')
  assert.equal(blocked.retryAfterSeconds, 60)

  timestamp += 60_001
  assert.equal(guard.tryAcquire('user-3').allowed, true)
})

test('refunds a burst slot when no provider request is made', () => {
  const guard = createGenerationGuard({ maxConcurrent: 1, requestsPerMinute: 1 })
  const reservation = guard.tryAcquire('user-1')
  reservation.cancel()

  assert.equal(guard.tryAcquire('user-2').allowed, true)
})
