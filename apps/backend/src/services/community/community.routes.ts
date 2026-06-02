import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { getCommunityEventDesc, listCommunityDesc } from '../../descriptions/community'
import { slugParamSchema } from '../../lib/schemas'
import { CommunityService } from './community.service'

const communityApp = new Hono()

// TODO: CACHE post-deploy — static events list, no per-user data, single global key.
// cacheHandler(cache, { prefix: 'community', ttl: 300, staleTtl: 120 }) → cache 5m / staleWhileRevalidate 2m.
communityApp.get('/', listCommunityDesc, async (c) => {
  const data = await CommunityService.listEvents()
  return c.json({ data })
})

// TODO: CACHE post-deploy — single event by slug, cardinality bounded by event count. cache 5m / staleWhileRevalidate 2m.
communityApp.get('/:slug', getCommunityEventDesc, validator('param', slugParamSchema), async (c) => {
  const { slug } = c.req.valid('param')
  const data = await CommunityService.getEventBySlug(slug)
  return c.json({ data })
})

export type CommunityAppType = typeof communityApp

export default communityApp
