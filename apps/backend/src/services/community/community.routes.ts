import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { getCommunityEventDesc, listCommunityDesc } from '../../descriptions/community'
import { slugParamSchema } from '../../lib/schemas'
import { cache } from '../../lib/cache'
import { cacheable } from '../../lib/cache/cacheable'
import { cacheControl } from '../../lib/cache/cache-control'
import { CommunityService } from './community.service'

const communityApp = new Hono()

// RAM data cache (single-flighted) — caches the service result, not the HTTP response.
const listEventsCached = cacheable(cache, 'community', { ttl: 300, staleTtl: 120 }, () =>
  CommunityService.listEvents(),
)
const getEventCached = cacheable(cache, 'community-event', { ttl: 300, staleTtl: 120 }, (slug: string) =>
  CommunityService.getEventBySlug(slug),
)

// Static events list, no per-user data.
communityApp.get('/', listCommunityDesc, cacheControl(300, 120), async (c) => {
  const data = await listEventsCached()
  return c.json({ data })
})

communityApp.get('/:slug', getCommunityEventDesc, validator('param', slugParamSchema), cacheControl(300, 120), async (c) => {
  const { slug } = c.req.valid('param')
  const data = await getEventCached(slug)
  return c.json({ data })
})

export type CommunityAppType = typeof communityApp

export default communityApp
