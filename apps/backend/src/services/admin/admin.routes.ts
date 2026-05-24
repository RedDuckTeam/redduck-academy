import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import {
  adminCertificatesQuerySchema,
  adminLessonParamSchema,
  adminLessonSubmissionsQuerySchema,
  adminUserIdParamSchema,
  adminUserLessonParamSchema,
  adminUsersQuerySchema,
  banUserBodySchema,
} from '@redduck/api-contracts'
import {
  adminAiCostsDesc,
  adminCertificatesDesc,
  adminHealthDesc,
  adminLessonsTreeDesc,
  adminLessonSubmissionsDesc,
  adminStatsDesc,
  adminUsersDesc,
  adminUserCompletedLessonsDesc,
  adminUserLessonDetailDesc,
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

adminApp.get('/lessons/tree', requireAdmin, adminLessonsTreeDesc, async (c) => {
  const data = await AdminService.getLessonsTree()
  return c.json({ data })
})

adminApp.get('/ai-costs', requireAdmin, adminAiCostsDesc, async (c) => {
  const data = await AdminService.getAiCostDashboard()
  return c.json({ data })
})

adminApp.get(
  '/lessons/:courseSlug/:lessonSlug/submissions',
  requireAdmin,
  adminLessonSubmissionsDesc,
  validator('param', adminLessonParamSchema),
  validator('query', adminLessonSubmissionsQuerySchema),
  async (c) => {
    const { courseSlug, lessonSlug } = c.req.valid('param')
    const q = c.req.valid('query')
    const { limit, offset, page, pageSize } = parsePaginationQuery({
      page: q.page,
      pageSize: q.pageSize,
    })
    const result = await AdminService.getLessonSubmissionsPage({
      courseSlug,
      lessonSlug,
      limit,
      offset,
      search: q.search,
    })
    return c.json({
      data: {
        items: result.items,
        total: result.total,
        page,
        pageSize,
        lesson: result.lesson,
      },
    })
  },
)

adminApp.get(
  '/users/:userId/completed-lessons',
  requireAdmin,
  adminUserCompletedLessonsDesc,
  validator('param', adminUserIdParamSchema),
  async (c) => {
    const { userId } = c.req.valid('param')
    const data = await AdminService.getUserCompletedLessons(userId)
    return c.json({ data })
  },
)

adminApp.get(
  '/users/:userId/lessons/:courseSlug/:lessonSlug',
  requireAdmin,
  adminUserLessonDetailDesc,
  validator('param', adminUserLessonParamSchema),
  async (c) => {
    const { userId, courseSlug, lessonSlug } = c.req.valid('param')
    const data = await AdminService.getLessonForUser(userId, courseSlug, lessonSlug)
    return c.json({ data })
  },
)

adminApp.patch(
  '/users/:userId/ban',
  requireAdmin,
  validator('param', adminUserIdParamSchema),
  validator('json', banUserBodySchema),
  async (c) => {
    const { userId } = c.req.valid('param')
    const { ban } = c.req.valid('json')
    const data = await AdminService.banUser(userId, ban)
    return c.json({ data })
  },
)

export type AdminAppType = typeof adminApp

export default adminApp
