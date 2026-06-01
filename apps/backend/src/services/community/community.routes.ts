import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { getCommunityEventDesc, listCommunityDesc } from '../../descriptions/community'
import { slugParamSchema } from '../../lib/schemas'
import { cache } from '../../lib/cache'
import { cacheHandler } from '../../lib/cache/middleware'
import { CommunityService } from './community.service'

const communityApp = new Hono()

// Static events list, no per-user data, single global key.
communityApp.get(
  '/',
  listCommunityDesc,
  cacheHandler(cache, { prefix: 'community', ttl: 300, staleTtl: 120 }, async (c) => {
    const data = await CommunityService.listEvents()
    return c.json({ data })
  }),
)

// Single event by slug, cardinality bounded by event count.
communityApp.get(
  '/:slug',
  getCommunityEventDesc,
  validator('param', slugParamSchema),
  cacheHandler(cache, { prefix: 'community-event', ttl: 300, staleTtl: 120 }, async (c) => {
    // validator('param') above already ran; read the raw param (cacheHandler's Context loses the typed valid()).
    const slug = c.req.param('slug')!
    const data = await CommunityService.getEventBySlug(slug)
    return c.json({ data })
  }),
)

export type CommunityAppType = typeof communityApp

export default communityApp
