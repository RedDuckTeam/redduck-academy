import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { listCoursesDesc, getCourseDesc, listCoursesInfoDesc } from '../../descriptions/courses'
import { slugParamSchema } from '../../lib/schemas'
import type { AuthVariables } from '../../lib/types'
import { CoursesService } from './courses.service'

const coursesApp = new Hono<{ Variables: AuthVariables }>()

coursesApp.get('/', listCoursesDesc, async (c) => {
  const data = await CoursesService.listCourses()
  return c.json({ data })
})

coursesApp.get('/info', listCoursesInfoDesc, async (c) => {
  const data = await CoursesService.listCoursesInfo()
  return c.json({ data })
})

coursesApp.get('/:slug', getCourseDesc, validator('param', slugParamSchema), async (c) => {
  const { slug } = c.req.valid('param')
  const data = await CoursesService.getCourseBySlug(slug)
  return c.json({ data })
})

export type CoursesAppType = typeof coursesApp

export default coursesApp
