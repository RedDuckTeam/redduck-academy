import type { CacheStore, CacheableOptions, CacheableSWROptions } from './types'
import { Logger } from '../logger'

const logger = new Logger('Cacheable')

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

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/**
 * Wraps an async function with caching. Hono alternative to NestJS @Cacheable decorator.
 *
 * - Uses a CacheStore (in-memory or Redis).
 * - Generates cache key from prefix, fn name, and serialized args.
 *
 * @param cache - Cache store (from createMemoryCache or createRedisCache)
 * @param cacheKeyPrefix - Key prefix for grouping
 * @param ttlOrOptions - TTL in seconds, or SWR options
 * @param fn - Async function to cache
 *
 * @example
 * ```ts
 * // Standard mode (1 hour)
 * const getCourses = cacheable(cache, 'courses', 3600, async () => {
 *   return db.query.courses.findMany()
 * })
 *
 * // SWR mode (5 min stale, 30 min hard TTL)
 * const getProducts = cacheable(cache, 'products', { ttl: 1800, staleTtl: 300 }, async () => {
 *   return fetchProducts()
 * })
 * ```
 */
export function cacheable<TArgs extends unknown[], TResult>(
  cache: CacheStore,
  cacheKeyPrefix: string,
  ttlOrOptions: CacheableOptions,
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  const swrEnabled =
    typeof ttlOrOptions === 'object' && 'staleTtl' in ttlOrOptions
  const hardTtlSeconds = swrEnabled ? ttlOrOptions.ttl : ttlOrOptions
  const staleTtlSeconds = swrEnabled
    ? (ttlOrOptions as CacheableSWROptions).staleTtl
    : undefined

  const fnName = fn.name || 'anonymous'

  return async function (...args: TArgs): Promise<TResult> {
    const cacheKey = `[${cacheKeyPrefix}][${fnName}]_[args:${safeStringify(args)}]`

    try {
      const cached = await cache.get<unknown>(cacheKey)

      if (cached !== undefined) {
        if (swrEnabled && isSWREntry(cached)) {
          const ageMs = Date.now() - cached.cachedAt
          const staleTtlMs = staleTtlSeconds! * 1000

          if (ageMs <= staleTtlMs) {
            return cached.data as TResult
          }

          if (!refreshingKeys.has(cacheKey)) {
            refreshingKeys.add(cacheKey)
            fn(...args)
              .then(async (result) => {
                const entry: SWRCacheEntry<TResult> = {
                  __swr: true,
                  data: result,
                  cachedAt: Date.now(),
                }
                await cache.set(cacheKey, entry, hardTtlSeconds)
              })
              .catch((err) => logger.error('SWR refresh failed', err, { cacheKey }))
              .finally(() => refreshingKeys.delete(cacheKey))
          }

          return cached.data as TResult
        }

        return cached as TResult
      }
    } catch (err) {
      logger.error('Cache get failed', err, { cacheKey })
    }

    const result = await fn(...args)

    try {
      if (swrEnabled) {
        const entry: SWRCacheEntry<TResult> = {
          __swr: true,
          data: result,
          cachedAt: Date.now(),
        }
        await cache.set(cacheKey, entry, hardTtlSeconds)
      } else {
        await cache.set(cacheKey, result, hardTtlSeconds)
      }
    } catch (err) {
      logger.error('Cache set failed', err, { cacheKey })
    }

    return result
  }
}
