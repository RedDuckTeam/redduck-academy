import type { CacheStore } from './types'

interface MemoryEntry<T> {
  value: T
  expiresAt: number
}

/**
 * In-memory cache store. Suitable for single-instance deployments.
 * Entries are evicted on access when expired (lazy eviction).
 */
export function createMemoryCache(): CacheStore {
  const store = new Map<string, MemoryEntry<unknown>>()

  return {
    async get<T>(key: string): Promise<T | undefined> {
      const entry = store.get(key) as MemoryEntry<T> | undefined
      if (!entry) return undefined
      if (Date.now() > entry.expiresAt) {
        store.delete(key)
        return undefined
      }
      return entry.value
    },

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      })
    },

    async delete(key: string): Promise<void> {
      store.delete(key)
    },
  }
}
