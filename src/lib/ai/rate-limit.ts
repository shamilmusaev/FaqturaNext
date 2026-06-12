import 'server-only'

// Lightweight fixed-window rate limiter, keyed per user. Caps how often the AI
// endpoints can be called so a runaway client or abuse can't rack up OpenAI
// cost. State is in-process: good enough for a single instance / MVP. For
// multi-instance production, swap the Map for a shared store (e.g. Upstash
// Redis via @upstash/ratelimit) behind this same interface.

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number }

export function rateLimit(key: string, opts: { limit: number; windowMs: number }): RateLimitResult {
  const now = Date.now()

  // Opportunistic cleanup so the map doesn't grow without bound.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }
  if (bucket.count >= opts.limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  bucket.count += 1
  return { ok: true, retryAfterSeconds: 0 }
}

/** Per-feature limits, all per-user per-minute. */
export const AI_LIMITS = {
  magicFill: { limit: 15, windowMs: 60_000 },
  polish: { limit: 30, windowMs: 60_000 },
  polishAll: { limit: 10, windowMs: 60_000 },
} as const
