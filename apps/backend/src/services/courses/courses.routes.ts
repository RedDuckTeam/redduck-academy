import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { listCoursesDesc, getCourseDesc, listCoursesInfoDesc } from '../../descriptions/courses'
import { slugParamSchema } from '../../lib/schemas'
import type { AuthVariables } from '../../lib/types'
import { cache } from '../../lib/cache'
import { cacheable } from '../../lib/cache/cacheable'
import { cacheControl } from '../../lib/cache/cache-control'
import { CoursesService } from './courses.service'

const coursesApp = new Hono<{ Variables: AuthVariables }>()

// RAM data cache (single-flighted) — caches the service RESULT, not the HTTP response,
// so the handler always builds a fresh c.json() and CORS/headers are never touched.
const listCoursesCached = cacheable(cache, 'courses', { ttl: 600, staleTtl: 300 }, () =>
  CoursesService.listCourses(),
)
const listCoursesInfoCached = cacheable(cache, 'courses-info', { ttl: 600, staleTtl: 300 }, () =>
  CoursesService.listCoursesInfo(),
)
const getCourseCached = cacheable(cache, 'course', { ttl: 600, staleTtl: 300 }, (slug: string) =>
  CoursesService.getCourseBySlug(slug),
)

// Static course catalog, no per-user data. cacheControl → browser/CDN cache.
coursesApp.get('/', listCoursesDesc, cacheControl(600, 300), async (c) => {
  const data = await listCoursesCached()
  return c.json({ data })
})

coursesApp.get('/info', listCoursesInfoDesc, cacheControl(600, 300), async (c) => {
  const data = await listCoursesInfoCached()
  return c.json({ data })
})

coursesApp.get('/:slug', getCourseDesc, validator('param', slugParamSchema), cacheControl(600, 300), async (c) => {
  const { slug } = c.req.valid('param')
  const data = await getCourseCached(slug)
  return c.json({ data })
})

export type CoursesAppType = typeof coursesApp

export default coursesApp
