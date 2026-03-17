import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import {
  listCoursesDesc,
  getCourseDesc,
  listCoursesInfoDesc,
  validateTestLessonDesc,
} from '../../descriptions/courses'
import { auth } from '../../lib/auth'
import { HTTPException } from 'hono/http-exception'
import { CoursesService } from './courses.service'
import { CoursesTestService } from './courses-test.service'

const coursesApp = new Hono()

const slugParamSchema = z.object({ slug: z.string() })

const courseLessonParamSchema = z.object({
  courseSlug: z.string(),
  lessonSlug: z.string(),
})

/** User answers: question ID -> array of selected option IDs */
const validateAnswersSchema = z.record(z.string(), z.array(z.string()))

coursesApp.get('/', listCoursesDesc, async (c) => {
  const data = await CoursesService.listCourses()
  return c.json({ data })
})

coursesApp.get('/:slug', getCourseDesc, validator('param', slugParamSchema), async (c) => {
  const { slug } = c.req.valid('param')
  const data = await CoursesService.getCourseBySlug(slug)
  return c.json({ data })
})

coursesApp.get('/info', listCoursesInfoDesc, async (c) => {
  const data = await CoursesService.listCoursesInfo()
  return c.json({ data })
})

coursesApp.post(
  '/:courseSlug/lessons/:lessonSlug/validate',
  validateTestLessonDesc,
  validator('param', courseLessonParamSchema),
  validator('json', validateAnswersSchema),
  async (c) => {
    const { courseSlug, lessonSlug } = c.req.valid('param')
    const userAnswers = c.req.valid('json')

    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session || !session.user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { score, correctAnswers } = await CoursesTestService.validateTestLesson(
      courseSlug,
      lessonSlug,
      session.user.id,
      userAnswers,
    )

    return c.json({ score, correctAnswers })
  },
)

export type CoursesAppType = typeof coursesApp

export default coursesApp
