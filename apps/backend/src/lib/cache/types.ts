/**
 * Cache store interface. Implement this for in-memory, Redis, or other backends.
 * TTL is in seconds.
 */
export interface CacheStore {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  delete(key: string): Promise<void>
}

/**
 * Stale-while-revalidate (SWR) options.
 *
 * - **Fresh** (age < staleTtl): return cached, no refresh
 * - **Stale** (staleTtl < age < ttl): return cached immediately, trigger background refresh
 * - **Expired** (age > ttl / miss): blocking fetch
 */
export interface CacheableSWROptions {
  /** Hard TTL in seconds – entry evicted after this */
  ttl: number
  /** Stale threshold in seconds – background refresh triggered after this */
  staleTtl: number
}

export type CacheableOptions = number | CacheableSWROptions
