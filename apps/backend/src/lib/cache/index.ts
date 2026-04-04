import { createMemoryCache } from './memory'

/**
 * Shared cache instance.
 * Import this everywhere instead of constructing a new store.
 *
 * TODO: swap for createRedisCache when ready for production.
 */
export const cache = createMemoryCache()
