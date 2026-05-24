import { Hono } from 'hono'
import { authProxyDesc } from '../../descriptions/auth'
import { auth } from '../../lib/auth'

const app = new Hono({ strict: false })

// NO CACHE — auth proxy (sessions, login, OAuth callbacks). Per-request, security-sensitive; must never be cached.
app.on(
  ['POST', 'GET', 'OPTIONS'],
  '/api/auth/*',
  authProxyDesc,
  async (c) => {
    return auth.handler(c.req.raw)
  },
)

export default app
