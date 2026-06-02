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
import { cache } from '../../lib/cache'
import { cacheHandler } from '../../lib/cache/middleware'
import { AdminService } from './admin.service'

const adminApp = new Hono<{ Variables: AuthVariables }>()

// NO CACHE — trivial health/auth probe; caching adds nothing.
adminApp.get('/', requireAdmin, adminHealthDesc, async (c) => {
  return c.json({ ok: true })
})

// Expensive global aggregation, single key, admin dashboard tolerates slight staleness.
adminApp.get(
  '/stats',
  requireAdmin,
  adminStatsDesc,
  cacheHandler(cache, { prefix: 'admin-stats', ttl: 120, staleTtl: 60 }, async (c) => {
    const data = await AdminService.getStats()
    return c.json({ data })
  }),
)

// TODO: NO CACHE — page/pageSize/sortBy/sortDir/search query params explode cache-key cardinality (esp. free-text
// search) → RAM bloat for little hit-rate gain. Leave uncached. If ever needed, cache only the default unfiltered first page.
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

// TODO: NO CACHE — page/sort/status/search query params → unbounded key cardinality → RAM bloat. Leave uncached.
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

// Heavy aggregation (per-lesson submission counts across all courses), single global key.
adminApp.get(
  '/lessons/tree',
  requireAdmin,
  adminLessonsTreeDesc,
  cacheHandler(cache, { prefix: 'admin-lessons-tree', ttl: 120, staleTtl: 60 }, async (c) => {
    const data = await AdminService.getLessonsTree()
    return c.json({ data })
  }),
)

// Heavy AI cost aggregation, single global key. Result is a now()-based snapshot, so TTL is short and SWR refreshes it.
adminApp.get(
  '/ai-costs',
  requireAdmin,
  adminAiCostsDesc,
  cacheHandler(cache, { prefix: 'admin-ai-costs', ttl: 120, staleTtl: 60 }, async (c) => {
    const data = await AdminService.getAiCostDashboard()
    return c.json({ data })
  }),
)

// TODO: NO CACHE — paginated + free-text search (page/pageSize/search) over a course×lesson path → key cardinality
// explodes → RAM bloat. Leave uncached.
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

// Keyed by userId (safe — userId is in the URL, so no cross-user leak). Short TTL; low-traffic admin-only.
adminApp.get(
  '/users/:userId/completed-lessons',
  requireAdmin,
  adminUserCompletedLessonsDesc,
  validator('param', adminUserIdParamSchema),
  cacheHandler(cache, { prefix: 'admin-user-completed', ttl: 60, staleTtl: 30 }, async (c) => {
    // validator('param') above already ran; read the raw param (cacheHandler's Context loses the typed valid()).
    const userId = c.req.param('userId')!
    const data = await AdminService.getUserCompletedLessons(userId)
    return c.json({ data })
  }),
)

// TODO: NO CACHE — key cardinality is users × lessons, and it's low-traffic admin-only inspection (poor hit rate).
// Caching would burn RAM with little benefit. Leave uncached.
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
