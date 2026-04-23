import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import {
  adminCertificatesDesc,
  adminCertificatesQuerySchema,
  adminHealthDesc,
  adminStatsDesc,
  adminUsersDesc,
  adminUsersQuerySchema,
} from '../../descriptions/admin'
import { parsePaginationQuery } from '../../lib/pagination'
import { requireAdmin } from '../../lib/middleware'
import type { AuthVariables } from '../../lib/types'
import { AdminService } from './admin.service'

const adminApp = new Hono<{ Variables: AuthVariables }>()

adminApp.get('/', requireAdmin, adminHealthDesc, async (c) => {
  return c.json({ ok: true })
})

adminApp.get('/stats', requireAdmin, adminStatsDesc, async (c) => {
  const data = await AdminService.getStats()
  return c.json({ data })
})

adminApp.get(
  '/users',
  requireAdmin,
  adminUsersDesc,
  validator('query', adminUsersQuerySchema),
  async (c) => {
    const q = c.req.valid('query')
    const { limit, offset, page, pageSize } = parsePaginationQuery({
      page: q.page,
      pageSize: q.pageSize,
    })
    const { rows, total } = await AdminService.getUsersPage({
      limit,
      offset,
      sortBy: q.sortBy,
      sortDir: q.sortDir,
      search: q.search,
    })
    return c.json({ data: { items: rows, total, page, pageSize } })
  },
)

adminApp.get(
  '/certificates',
  requireAdmin,
  adminCertificatesDesc,
  validator('query', adminCertificatesQuerySchema),
  async (c) => {
    const q = c.req.valid('query')
    const { limit, offset, page, pageSize } = parsePaginationQuery({
      page: q.page,
      pageSize: q.pageSize,
    })
    const { rows, total } = await AdminService.getCertificatesPage({
      limit,
      offset,
      sortBy: q.sortBy,
      sortDir: q.sortDir,
      status: q.status,
      search: q.search,
    })
    return c.json({ data: { items: rows, total, page, pageSize } })
  },
)

export type AdminAppType = typeof adminApp

export default adminApp
