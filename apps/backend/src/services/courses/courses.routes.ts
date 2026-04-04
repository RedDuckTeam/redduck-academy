import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import {
  listCoursesDesc,
  getCourseDesc,
  listCoursesInfoDesc,
  validateTestLessonDesc,
} from '../../descriptions/courses'
import { requireAuth } from '../../lib/middleware'
import { slugParamSchema, courseLessonParamSchema } from '../../lib/schemas'
import type { AuthVariables } from '../../lib/types'
import { CoursesService } from './courses.service'
import { CoursesTestService } from './courses-test.service'

/** User answers: question ID -> array of selected option IDs */
const validateAnswersSchema = z.record(z.string(), z.array(z.string()))

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

coursesApp.post(
  '/:courseSlug/lessons/:lessonSlug/validate',
  validateTestLessonDesc,
  requireAuth,
  validator('param', courseLessonParamSchema),
  validator('json', validateAnswersSchema),
  async (c) => {
    const { courseSlug, lessonSlug } = c.req.valid('param')
    const userAnswers = c.req.valid('json')
    const user = c.get('user')

    const { score, correctAnswers } = await CoursesTestService.validateTestLesson(
      courseSlug,
      lessonSlug,
      user.id,
      userAnswers,
    )

    return c.json({ score, correctAnswers })
  },
)

export type CoursesAppType = typeof coursesApp

export default coursesApp
