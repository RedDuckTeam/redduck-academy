import { Hono } from 'hono'
import { auth } from '../lib/auth'

const app = new Hono({ strict: false })

app.on(['POST', 'GET', 'OPTIONS'], '/api/auth/*', async (c) => {
  return auth.handler(c.req.raw)
})

export default app
