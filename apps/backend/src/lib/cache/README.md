# Hono Caching

NestJS `@Cacheable`-style caching for Hono. Supports in-memory and Redis backends, with optional stale-while-revalidate (SWR).

## Setup

### In-memory (no deps)

```ts
import { createMemoryCache } from './lib/cache/memory'

const cache = createMemoryCache()
```

### Redis (requires ioredis)

```bash
yarn add ioredis
```

```ts
import Redis from 'ioredis'
import { createRedisCache } from './lib/cache/redis'

const redis = new Redis(process.env.REDIS_URL)
const cache = createRedisCache(redis)
```

## Response caching (HTTP handlers)

Use `cacheHandler` to cache GET responses:

```ts
import { cacheHandler } from './lib/cache/middleware'
import { createMemoryCache } from './lib/cache/memory'

const cache = createMemoryCache()

// Standard mode (10 min TTL)
app.get(
  '/api/courses',
  cacheHandler(cache, { prefix: 'courses', ttl: 600 }, async (c) => {
    const data = await db.query.courses.findMany()
    return c.json({ data })
  })
)

// SWR mode (5 min stale threshold, 30 min hard TTL)
app.get(
  '/api/products',
  cacheHandler(cache, { prefix: 'products', ttl: 1800, staleTtl: 300 }, handler)
)
```

## Function caching (like NestJS @Cacheable)

Use `cacheable` to cache async function results:

```ts
import { cacheable } from './lib/cache/cacheable'
import { createMemoryCache } from './lib/cache/memory'

const cache = createMemoryCache()

// Standard (1 hour)
const getCourses = cacheable(cache, 'courses', 3600, async () => {
  return db.query.courses.findMany()
})

// SWR (5 min stale, 30 min TTL)
const getProducts = cacheable(
  cache,
  'products',
  { ttl: 1800, staleTtl: 300 },
  async () => fetchProducts()
)

// In a handler
app.get('/api/courses', async (c) => {
  const data = await getCourses()
  return c.json({ data })
})
```

## SWR behavior

- **Fresh** (age < staleTtl): return cached, no refresh
- **Stale** (staleTtl < age < ttl): return cached, trigger background refresh
- **Expired** (age > ttl / miss): blocking fetch
