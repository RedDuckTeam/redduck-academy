import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { getLessonDesc, markLessonAsCompletedDesc, submitProjectDesc, submitTestDesc } from '../../descriptions/lessons'
import { requireAuth } from '../../lib/middleware'
import { courseLessonParamSchema } from '../../lib/schemas'
import type { AuthVariables } from '../../lib/types'
import { HTTPException } from 'hono/http-exception'
import { CoursesTestService } from '../courses/courses-test.service'
import { ReviewService } from '../review/review.service'
import { LessonsService } from './lessons.service'

const submitTestBodySchema = z.object({
  courseSlug: z.string(),
  lessonSlug: z.string(),
  answers: z.record(z.string(), z.array(z.string())),
})

const submitProjectBodySchema = z.object({
  courseSlug: z.string(),
  lessonSlug: z.string(),
  repoUrl: z.string().url(),
})

const lessonsApp = new Hono<{ Variables: AuthVariables }>()

lessonsApp.post('/submit-test', requireAuth, submitTestDesc, validator('json', submitTestBodySchema), async (c) => {
  const user = c.get('user')
  const { courseSlug, lessonSlug, answers } = c.req.valid('json')
  await CoursesTestService.validateTestLesson(courseSlug, lessonSlug, user.id, answers)
  return c.json({ success: true })
})

lessonsApp.post(
  '/submit-project',
  requireAuth,
  submitProjectDesc,
  validator('json', submitProjectBodySchema),
  async (c) => {
    const user = c.get('user')
    const { courseSlug, lessonSlug, repoUrl } = c.req.valid('json')
    await ReviewService.submitProject(user.id, courseSlug, lessonSlug, repoUrl)
    return c.json({ success: true })
  },
)

lessonsApp.get('/:courseSlug/:lessonSlug', getLessonDesc, validator('param', courseLessonParamSchema), async (c) => {
  const { courseSlug, lessonSlug } = c.req.valid('param')
  const data = await LessonsService.getLesson(courseSlug, lessonSlug)
  return c.json({ data })
})

lessonsApp.post(
  '/:courseSlug/:lessonSlug/mark-completed',
  requireAuth,
  markLessonAsCompletedDesc,
  validator('param', courseLessonParamSchema),
  async (c) => {
    const user = c.get('user')
    const { courseSlug, lessonSlug } = c.req.valid('param')
    const lesson = await LessonsService.getLesson(courseSlug, lessonSlug)

    if (lesson.type !== 'lecture') {
      throw new HTTPException(400, {
        message: 'Only lectures can be marked as completed',
      })
    }

    await LessonsService.markLessonAsCompleted(user.id, courseSlug, lessonSlug)
    return c.json({ success: true })
  },
)

export type LessonsAppType = typeof lessonsApp

export default lessonsApp
