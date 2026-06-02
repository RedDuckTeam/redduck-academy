import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { listCoursesDesc, getCourseDesc, listCoursesInfoDesc } from '../../descriptions/courses'
import { slugParamSchema } from '../../lib/schemas'
import type { AuthVariables } from '../../lib/types'
import { CoursesService } from './courses.service'

const coursesApp = new Hono<{ Variables: AuthVariables }>()

// TODO: CACHE post-deploy — static course catalog, no per-user data, no query params (single global key).
// cacheHandler(cache, { prefix: 'courses', ttl: 600, staleTtl: 300 }) → cache 10m / staleWhileRevalidate 5m.
coursesApp.get('/', listCoursesDesc, async (c) => {
  const data = await CoursesService.listCourses()
  return c.json({ data })
})

// TODO: CACHE post-deploy — static catalog metadata, single global key. cache 10m / staleWhileRevalidate 5m.
coursesApp.get('/info', listCoursesInfoDesc, async (c) => {
  const data = await CoursesService.listCoursesInfo()
  return c.json({ data })
})

// TODO: CACHE post-deploy — one course by slug; key cardinality bounded by course count (safe for RAM). cache 10m / staleWhileRevalidate 5m.
coursesApp.get('/:slug', getCourseDesc, validator('param', slugParamSchema), async (c) => {
  const { slug } = c.req.valid('param')
  const data = await CoursesService.getCourseBySlug(slug)
  return c.json({ data })
})

export type CoursesAppType = typeof coursesApp

export default coursesApp
