import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { createProposalBodySchema } from '@redduck/api-contracts'
import { createProposalDesc } from '../../descriptions/proposals'
import { optionalAuth } from '../../lib/middleware'
import { getClientIp } from '../../lib/client-ip'
import type { AuthVariables } from '../../lib/types'
import { ProposalsService } from './proposals.service'

const proposalsApp = new Hono<{ Variables: AuthVariables }>()

// Open to visitors with no account, which is the point of the feature. `optionalAuth` decides the
// door: a verified session skips the captcha, no session requires one. The door is never read from
// the request body — a caller who could name their own door could skip the challenge by asking to.
proposalsApp.post('/', optionalAuth, createProposalDesc, validator('json', createProposalBodySchema), async (c) => {
  const result = await ProposalsService.submit(c.req.valid('json'), {
    privyUserId: c.get('privyUserId') ?? null,
    clientIp: getClientIp(c),
  })
  return c.json(result, 201)
})

export default proposalsApp
