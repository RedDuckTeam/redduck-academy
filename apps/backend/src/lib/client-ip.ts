import type { Context } from 'hono'

/**
 * The trusted client IP.
 *
 * Heroku's router appends the originating address as the LAST value in x-forwarded-for, so the
 * first entry is whatever the client chose to send and must never be trusted. Returns '' when the
 * address cannot be established; callers should treat that as un-attributable rather than as a
 * shared bucket.
 *
 * Assumes exactly one trusted proxy. Putting a CDN in front of the API would make the right-most
 * value a constant edge address, collapsing every caller into one bucket — revisit this first.
 */
export function getClientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]!
  }
  return c.req.header('cf-connecting-ip') ?? c.req.header('x-real-ip') ?? ''
}
