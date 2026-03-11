import { describeRoute } from 'hono-openapi'

export const authProxyDesc = describeRoute({
  summary: 'Auth proxy',
  description:
    'Proxies authentication requests to BetterAuth. Handles sign-in, sign-up, sign-out, session, and OAuth flows.',
  tags: ['Auth'],
  responses: {
    200: { description: 'Auth operation completed' },
    302: { description: 'Redirect (e.g. OAuth callback)' },
    401: { description: 'Unauthorized' },
  },
})
