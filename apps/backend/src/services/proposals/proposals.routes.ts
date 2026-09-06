import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { createProposalBodySchema } from '@redduck/api-contracts'
import { createProposalDesc } from '../../descriptions/proposals'
import { optionalAuth, rejectBannedUser } from '../../lib/middleware'
import { rateLimit } from '../../lib/rate-limit'
import { getClientIp } from '../../lib/client-ip'
import type { OptionalAuthVariables } from '../../lib/types'
import { ProposalsService } from './proposals.service'

const proposalsApp = new Hono<{ Variables: OptionalAuthVariables }>()

// Open to visitors with no account, which is the point of the feature. `optionalAuth` decides the
// door: a verified session skips the captcha, no session requires one. The door is never read from
// the request body — a caller who could name their own door could skip the challenge by asking to.
// Bounds raw attempts, which the quota cannot: a submission refused for a bad frontmatter field
// releases its reserved slot, so without this a caller who never succeeds is never throttled while
// still spending two GitHub calls per try against the installation's hourly budget.
const attemptLimit = rateLimit({ windowMs: 60_000, max: 10 })

proposalsApp.post(
  '/',
  attemptLimit,
  optionalAuth,
  // A suspended account keeps no privileges here: this is the most powerful write the app exposes
  // to a signed-in user, and it is the only such route that reaches the repository.
  rejectBannedUser,
  createProposalDesc,
  validator('json', createProposalBodySchema),
  async (c) => {
    const result = await ProposalsService.submit(c.req.valid('json'), {
      privyUserId: c.get('privyUserId') ?? null,
      clientIp: getClientIp(c),
    })
    return c.json(result, 201)
  },
)

export default proposalsApp
