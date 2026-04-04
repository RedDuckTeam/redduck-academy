import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { getCommunityEventDesc, listCommunityDesc } from '../../descriptions/community'
import { slugParamSchema } from '../../lib/schemas'
import { CommunityService } from './community.service'

const communityApp = new Hono()

communityApp.get('/', listCommunityDesc, async (c) => {
  const data = await CommunityService.listEvents()
  return c.json({ data })
})

communityApp.get('/:slug', getCommunityEventDesc, validator('param', slugParamSchema), async (c) => {
  const { slug } = c.req.valid('param')
  const data = await CommunityService.getEventBySlug(slug)
  return c.json({ data })
})

export type CommunityAppType = typeof communityApp

export default communityApp
