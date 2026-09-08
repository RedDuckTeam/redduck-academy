import type { Context, MiddlewareHandler } from 'hono'
import { getClientIp } from './client-ip'

// Fixed-window in-memory rate limiter. State is per-process — effective cap
// scales with dyno count. Fine for DoS shielding; not a global budget.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

setInterval(
  () => {
    const now = Date.now()
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k)
  },
  5 * 60 * 1000,
).unref()

export interface RateLimitOptions {
  windowMs: number
  max: number
  /** Defaults to client IP from X-Forwarded-For. */
  keyOf?: (c: Context) => string
}

function defaultKey(c: Context): string {
  // Authenticated requests: key by the bearer token so users sharing an IP
  // (NAT, CF Workers calling the API during SSR, mobile CGNAT) each get their
  // own budget. Last 32 chars of the JWT are the signature — unique per token.
  const auth = c.req.header('authorization')
  if (auth?.startsWith('Bearer ')) return `t:${auth.slice(-32)}`

  return `ip:${getClientIp(c) || 'unknown'}`
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  const { windowMs, max } = opts
  const keyOf = opts.keyOf ?? defaultKey
  return async (c, next) => {
    const key = keyOf(c)
    const now = Date.now()
    let bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs }
      buckets.set(key, bucket)
    }
    bucket.count++
    const remaining = Math.max(0, max - bucket.count)
    c.header('X-RateLimit-Limit', String(max))
    c.header('X-RateLimit-Remaining', String(remaining))
    c.header('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)))
    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      c.header('Retry-After', String(retryAfter))
      return c.json({ error: 'Too many requests' }, 429)
    }
    await next()
  }
}
