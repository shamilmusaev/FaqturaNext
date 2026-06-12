import { describe, expect, it, vi } from 'vitest'

// rate-limit.ts pulls in `server-only`, which throws in the jsdom test env.
vi.mock('server-only', () => ({}))

const { rateLimit } = await import('@/lib/ai/rate-limit')

describe('rateLimit', () => {
  it('allows up to the limit then blocks within the window', () => {
    const key = `test-block-${Math.random()}`
    const opts = { limit: 3, windowMs: 60_000 }
    expect(rateLimit(key, opts).ok).toBe(true)
    expect(rateLimit(key, opts).ok).toBe(true)
    expect(rateLimit(key, opts).ok).toBe(true)
    const blocked = rateLimit(key, opts)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('keeps separate counters per key', () => {
    const opts = { limit: 1, windowMs: 60_000 }
    const a = `test-a-${Math.random()}`
    const b = `test-b-${Math.random()}`
    expect(rateLimit(a, opts).ok).toBe(true)
    expect(rateLimit(a, opts).ok).toBe(false)
    expect(rateLimit(b, opts).ok).toBe(true)
  })

  it('resets after the window elapses', () => {
    const key = `test-reset-${Math.random()}`
    expect(rateLimit(key, { limit: 1, windowMs: 0 }).ok).toBe(true)
    // windowMs 0 → the bucket is already expired on the next call, so it resets.
    expect(rateLimit(key, { limit: 1, windowMs: 0 }).ok).toBe(true)
  })
})
