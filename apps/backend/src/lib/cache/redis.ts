import type { CacheStore } from './types'

/**
 * Redis client interface. Compatible with ioredis and node-redis (v4).
 * Install: yarn add ioredis
 */
export interface RedisLike {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ...args: string[]): Promise<unknown>
  del(key: string): Promise<number>
}

/**
 * Create a CacheStore backed by Redis.
 * Values are JSON-serialized.
 *
 * @example
 * ```ts
 * import Redis from 'ioredis'
 * import { createRedisCache } from './lib/cache/redis'
 *
 * const redis = new Redis(process.env.REDIS_URL)
 * const cache = createRedisCache(redis)
 * ```
 */
export function createRedisCache(redis: RedisLike): CacheStore {
  return {
    async get<T>(key: string): Promise<T | undefined> {
      const raw = await redis.get(key)
      if (raw === null) return undefined
      try {
        return JSON.parse(raw) as T
      } catch {
        return undefined
      }
    },

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
      const serialized = JSON.stringify(value)
      await redis.set(key, serialized, 'EX', String(ttlSeconds))
    },

    async delete(key: string): Promise<void> {
      await redis.del(key)
    },
  }
}
