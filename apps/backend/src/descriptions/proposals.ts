import { describeRoute, resolver } from 'hono-openapi'
import { createProposalResponseSchema } from '@redduck/api-contracts'
import { errorSchema } from './schemas'

export const createProposalDesc = describeRoute({
  summary: 'Propose a lesson edit',
  description:
    'Commits a Markdown lesson edit to a fresh `proposal/**` branch and opens a pull request against `main`. Open to visitors with no account: a request without a Privy bearer token must carry a Cloudflare Turnstile token instead. The change is never published directly — it goes through the same review and content validation as any other pull request, and reaches the site only once merged and rebuilt.',
  tags: ['Proposals'],
  responses: {
    201: {
      description: 'Pull request opened',
      content: { 'application/json': { schema: resolver(createProposalResponseSchema) } },
    },
    400: { description: 'Turnstile challenge failed', content: { 'application/json': { schema: errorSchema } } },
    401: {
      description: 'Claimed a signed-in door without a valid session',
      content: { 'application/json': { schema: errorSchema } },
    },
    409: {
      description: 'The lesson changed on main while the contributor was editing',
      content: { 'application/json': { schema: errorSchema } },
    },
    422: {
      description: 'The submitted file breaks a content rule; the response lists each violation',
      content: { 'application/json': { schema: errorSchema } },
    },
    429: {
      description: 'Quota exhausted; `retryAfterMs` says when the window frees up',
      content: { 'application/json': { schema: errorSchema } },
    },
    503: {
      description: 'Proposals are disabled or not fully configured',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})
