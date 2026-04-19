import { Hono } from 'hono'
import { requireAdmin } from '../../lib/middleware'
import type { AuthVariables } from '../../lib/types'
import { adminHealthDesc } from '../../descriptions/admin'

const adminApp = new Hono<{ Variables: AuthVariables }>()

adminApp.get('/', requireAdmin, adminHealthDesc, async (c) => {
  return c.json({ ok: true })
})

export type AdminAppType = typeof adminApp

export default adminApp
