import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { getLessonDesc, markLessonAsCompletedDesc, submitTestDesc } from '../../descriptions/lessons'
import { auth } from '../../lib/auth'
import { HTTPException } from 'hono/http-exception'
import { LessonsService } from './lessons.service'
import { CoursesTestService } from '../courses/courses-test.service'

const submitTestBodySchema = z.object({
  courseSlug: z.string(),
  lessonSlug: z.string(),
  answers: z.record(z.string(), z.array(z.string())),
})

const courseLessonParamSchema = z.object({
  courseSlug: z.string(),
  lessonSlug: z.string(),
})

const lessonsApp = new Hono()

lessonsApp.post(
  '/submit-test',
  submitTestDesc,
  validator('json', submitTestBodySchema),
  async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session || !session.user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }
    const { courseSlug, lessonSlug, answers } = c.req.valid('json')
    await CoursesTestService.validateTestLesson(courseSlug, lessonSlug, session.user.id, answers)
    return c.json({ success: true })
  },
)

lessonsApp.get(
  '/:courseSlug/:lessonSlug',
  getLessonDesc,
  validator('param', courseLessonParamSchema),
  async (c) => {
    const { courseSlug, lessonSlug } = c.req.valid('param')
    const data = await LessonsService.getLesson(courseSlug, lessonSlug)
    return c.json({ data })
  },
)

lessonsApp.post(
  '/:courseSlug/:lessonSlug/mark-completed',
  markLessonAsCompletedDesc,
  validator('param', courseLessonParamSchema),
  async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session || !session.user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { courseSlug, lessonSlug } = c.req.valid('param')
    const lesson = await LessonsService.getLesson(courseSlug, lessonSlug)

    if (lesson.type !== 'lecture') {
      throw new HTTPException(400, {
        message: 'Only lectures can be marked as completed',
      })
    }

    await LessonsService.markLessonAsCompleted(session.user.id, courseSlug, lessonSlug)
    return c.json({ success: true })
  },
)

export type LessonsAppType = typeof lessonsApp

export default lessonsApp
