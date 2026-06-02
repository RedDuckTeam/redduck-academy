import type { MiddlewareHandler } from 'hono'

/**
 * Sets `Cache-Control` on successful GET responses so the browser — and any CDN
 * in front of the API (e.g. Cloudflare) — can serve them without hitting the origin.
 *
 * Use ONLY on public, unauthenticated endpoints (no per-user data). Never on routes
 * behind requireAuth/requireAdmin: a shared cache could serve one user's response to
 * another.
 *
 * Also appends `Vary: Origin` so a shared cache keys entries per request origin and
 * can't serve a response carrying the wrong `Access-Control-Allow-Origin` to a
 * different origin (the CORS-at-the-CDN gotcha).
 */
export function cacheControl(maxAgeSeconds: number, staleWhileRevalidateSeconds?: number): MiddlewareHandler {
  const swr = staleWhileRevalidateSeconds ? `, stale-while-revalidate=${staleWhileRevalidateSeconds}` : ''
  const value = `public, max-age=${maxAgeSeconds}${swr}`

  return async (c, next) => {
    await next()
    // Only cache successful GETs; leave errors and mutations uncached.
    if (c.req.method === 'GET' && c.res.status >= 200 && c.res.status < 300) {
      c.res.headers.set('Cache-Control', value)
      // cors() already sets `Vary: Origin`; only add it if some other layer hasn't.
      const vary = c.res.headers.get('Vary')
      if (!vary) c.res.headers.set('Vary', 'Origin')
      else if (!/\borigin\b/i.test(vary)) c.res.headers.append('Vary', 'Origin')
    }
  }
}
