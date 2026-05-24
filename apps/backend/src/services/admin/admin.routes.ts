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

// NO CACHE — trivial health/auth probe; caching adds nothing.
adminApp.get('/', requireAdmin, adminHealthDesc, async (c) => {
  return c.json({ ok: true })
})

// TODO: CACHE post-deploy — expensive global aggregation, single key, admin dashboard tolerates slight staleness.
// cacheHandler(cache, { prefix: 'admin-stats', ttl: 120, staleTtl: 60 }) → cache 2m / staleWhileRevalidate 1m.
adminApp.get('/stats', requireAdmin, adminStatsDesc, async (c) => {
  const data = await AdminService.getStats()
  return c.json({ data })
})

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

// TODO: CACHE post-deploy — heavy aggregation (per-lesson submission counts across all courses), single global key.
// cacheHandler(cache, { prefix: 'admin-lessons-tree', ttl: 120, staleTtl: 60 }) → cache 2m / staleWhileRevalidate 1m.
adminApp.get('/lessons/tree', requireAdmin, adminLessonsTreeDesc, async (c) => {
  const data = await AdminService.getLessonsTree()
  return c.json({ data })
})

// TODO: CACHE post-deploy — heavy AI cost aggregation, single global key. Result is a now()-based snapshot, so keep TTL
// short and let SWR refresh it. cacheHandler(cache, { prefix: 'admin-ai-costs', ttl: 120, staleTtl: 60 }) → cache 2m / staleWhileRevalidate 1m.
adminApp.get('/ai-costs', requireAdmin, adminAiCostsDesc, async (c) => {
  const data = await AdminService.getAiCostDashboard()
  return c.json({ data })
})

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

// TODO: CACHE post-deploy (optional, short) — keyed by userId (safe, no leak: userId is in the URL), but cardinality
// grows with user count and this is low-traffic admin-only. cacheHandler(cache, { prefix: 'admin-user-completed', ttl: 60, staleTtl: 30 }) → cache 1m / staleWhileRevalidate 30s. Skip if RAM is tight.
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
