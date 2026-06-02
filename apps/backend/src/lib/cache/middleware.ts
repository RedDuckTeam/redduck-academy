import type { Context } from 'hono'
import type { CacheStore } from './types'
import { Logger } from '../logger'

const logger = new Logger('CacheMiddleware')

type CacheableHandler = (c: Context) => Response | Promise<Response>

interface CachedResponse {
  status: number
  headers: Record<string, string>
  body: string
}

/** Internal wrapper for SWR mode */
interface SWRCacheEntry<T = unknown> {
  __swr: true
  data: T
  cachedAt: number
}

function isSWREntry(value: unknown): value is SWRCacheEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__swr' in value &&
    (value as SWRCacheEntry).__swr === true
  )
}

const refreshingKeys = new Set<string>()

function buildCacheKey(c: Context, prefix: string): string {
  const url = new URL(c.req.url)
  const path = url.pathname
  const query = url.searchParams.toString()
  const qs = query ? `?${query}` : ''
  return `[${prefix}][${c.req.method}]${path}${qs}`
}

async function serializeResponse(res: Response): Promise<CachedResponse> {
  const body = await res.clone().text()
  const headers: Record<string, string> = {}
  res.headers.forEach((v, k) => {
    headers[k] = v
  })
  return { status: res.status, headers, body }
}

export type CacheMiddlewareOptions =
  | { prefix: string; ttl: number }
  | { prefix: string; ttl: number; staleTtl: number }

/**
 * Wraps a Hono handler with response caching. Caches GET responses.
 * Use as middleware: pass the handler as the last argument.
 *
 * @param cache - Cache store (memory or Redis)
 * @param options - Key prefix, TTL, optional staleTtl for SWR
 * @param handler - The handler to cache
 *
 * @example
 * ```ts
 * // Standard (10 min TTL)
 * app.get('/api/courses', cacheHandler(cache, { prefix: 'courses', ttl: 600 }, async (c) => {
 *   const data = await db.query.courses.findMany()
 *   return c.json({ data })
 * }))
 *
 * // SWR (5 min stale, 30 min hard TTL)
 * app.get('/api/products', cacheHandler(cache, {
 *   prefix: 'products',
 *   ttl: 1800,
 *   staleTtl: 300,
 * }, handler))
 * ```
 */
export function cacheHandler(
  cache: CacheStore,
  options: CacheMiddlewareOptions,
  handler: CacheableHandler,
): CacheableHandler {
  const { prefix, ttl } = options
  const swrEnabled = 'staleTtl' in options
  const staleTtlSeconds = swrEnabled ? options.staleTtl : undefined

  return async (c: Context) => {
    if (c.req.method !== 'GET') {
      return handler(c)
    }

    const cacheKey = buildCacheKey(c, prefix)

    try {
      const cached = await cache.get<CachedResponse | SWRCacheEntry<CachedResponse>>(cacheKey)

      if (cached !== undefined) {
        const response: CachedResponse =
          swrEnabled && isSWREntry(cached) ? cached.data : (cached as CachedResponse)

        if (swrEnabled && isSWREntry(cached)) {
          const ageMs = Date.now() - cached.cachedAt
          const staleTtlMs = staleTtlSeconds! * 1000

          if (ageMs > staleTtlMs && !refreshingKeys.has(cacheKey)) {
            refreshingKeys.add(cacheKey)
            Promise.resolve(handler(c))
              .then(async (res: Response) => {
                const toCache = await serializeResponse(res)
                const entry: SWRCacheEntry<CachedResponse> = {
                  __swr: true,
                  data: toCache,
                  cachedAt: Date.now(),
                }
                await cache.set(cacheKey, entry, ttl)
              })
              .catch((err: unknown) => logger.error('SWR refresh failed', err, { cacheKey }))
              .finally(() => refreshingKeys.delete(cacheKey))
          }
        }

        return new Response(response.body, {
          status: response.status,
          headers: new Headers(response.headers),
        })
      }
    } catch (err: unknown) {
      logger.error('Cache get failed', err, { cacheKey })
    }

    const res = await handler(c)

    try {
      const serialized = await serializeResponse(res)
      const toCache: CachedResponse | SWRCacheEntry<CachedResponse> = swrEnabled
        ? { __swr: true, data: serialized, cachedAt: Date.now() }
        : serialized

      await cache.set(cacheKey, toCache, ttl)
    } catch (err: unknown) {
      logger.error('Cache set failed', err, { cacheKey })
    }

    return res
  }
}
