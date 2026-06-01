import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { listCoursesDesc, getCourseDesc, listCoursesInfoDesc } from '../../descriptions/courses'
import { slugParamSchema } from '../../lib/schemas'
import type { AuthVariables } from '../../lib/types'
import { cache } from '../../lib/cache'
import { cacheHandler } from '../../lib/cache/middleware'
import { CoursesService } from './courses.service'

const coursesApp = new Hono<{ Variables: AuthVariables }>()

// Static course catalog, no per-user data, single global key.
coursesApp.get(
  '/',
  listCoursesDesc,
  cacheHandler(cache, { prefix: 'courses', ttl: 600, staleTtl: 300 }, async (c) => {
    const data = await CoursesService.listCourses()
    return c.json({ data })
  }),
)

// Static catalog metadata, single global key.
coursesApp.get(
  '/info',
  listCoursesInfoDesc,
  cacheHandler(cache, { prefix: 'courses-info', ttl: 600, staleTtl: 300 }, async (c) => {
    const data = await CoursesService.listCoursesInfo()
    return c.json({ data })
  }),
)

// One course by slug; key cardinality bounded by course count.
coursesApp.get(
  '/:slug',
  getCourseDesc,
  validator('param', slugParamSchema),
  cacheHandler(cache, { prefix: 'course', ttl: 600, staleTtl: 300 }, async (c) => {
    // validator('param') above already ran; read the raw param (cacheHandler's Context loses the typed valid()).
    const slug = c.req.param('slug')!
    const data = await CoursesService.getCourseBySlug(slug)
    return c.json({ data })
  }),
)

export type CoursesAppType = typeof coursesApp

export default coursesApp
