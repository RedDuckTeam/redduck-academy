import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import {
  courseLessonParamSchema,
  submitCodingTaskBodySchema,
  submitProjectBodySchema,
  submitTestBodySchema,
} from '@redduck/api-contracts'
import { getLessonDesc, markLessonAsCompletedDesc, submitCodingTaskDesc, submitProjectDesc, submitTestDesc } from '../../descriptions/lessons'
import { requireAuth, requireNotBanned, getClientIp } from '../../lib/middleware'
import type { AuthVariables } from '../../lib/types'
import { AppError } from '../../lib/errors'
import { CoursesTestService } from '../courses/courses-test.service'
import { ReviewService } from '../review/review.service'
import { CodingTaskService } from '../coding-task/coding-task.service'
import { LessonsService } from './lessons.service'
import { CoursePrerequisitesService } from '../courses/course-prerequisites.service'

const lessonsApp = new Hono<{ Variables: AuthVariables }>()

lessonsApp.post('/submit-test', requireAuth, requireNotBanned, submitTestDesc, validator('json', submitTestBodySchema), async (c) => {
  const user = c.get('user')
  const { courseSlug, lessonSlug, answers } = c.req.valid('json')
  const access = await CoursePrerequisitesService.checkCourseAccess(user.id, courseSlug)
  if (!access.allowed) throw new AppError(403, `Course locked: complete "${access.prerequisiteCourseTitle}" first`)
  await CoursesTestService.validateTestLesson(courseSlug, lessonSlug, user.id, answers)
  return c.json({ success: true })
})

lessonsApp.post(
  '/submit-project',
  requireAuth,
  requireNotBanned,
  submitProjectDesc,
  validator('json', submitProjectBodySchema),
  async (c) => {
    const user = c.get('user')
    const { courseSlug, lessonSlug, repoUrl } = c.req.valid('json')
    const access = await CoursePrerequisitesService.checkCourseAccess(user.id, courseSlug)
    if (!access.allowed) throw new AppError(403, `Course locked: complete "${access.prerequisiteCourseTitle}" first`)
    const ipAddress = getClientIp(c)
    await ReviewService.submitProject(user.id, courseSlug, lessonSlug, repoUrl, ipAddress)
    return c.json({ success: true as const })
  },
)

lessonsApp.post(
  '/submit-coding-task',
  requireAuth,
  requireNotBanned,
  submitCodingTaskDesc,
  validator('json', submitCodingTaskBodySchema),
  async (c) => {
    const user = c.get('user')
    const { courseSlug, lessonSlug, code, language, clientPassed } = c.req.valid('json')
    const access = await CoursePrerequisitesService.checkCourseAccess(user.id, courseSlug)
    if (!access.allowed) throw new AppError(403, `Course locked: complete "${access.prerequisiteCourseTitle}" first`)
    const ipAddress = getClientIp(c)
    const result = await CodingTaskService.submitCode(user.id, courseSlug, lessonSlug, code, language, clientPassed, ipAddress)
    return c.json(result)
  },
)

// TODO: CACHE post-deploy — public lesson content, NO user data here (user answers/progress live on /api/user/lessons/*).
// Key cardinality bounded by lesson count (safe for RAM). cacheHandler(cache, { prefix: 'lesson', ttl: 600, staleTtl: 300 }) → cache 10m / staleWhileRevalidate 5m.
lessonsApp.get('/:courseSlug/:lessonSlug', getLessonDesc, validator('param', courseLessonParamSchema), async (c) => {
  const { courseSlug, lessonSlug } = c.req.valid('param')
  const data = await LessonsService.getLesson(courseSlug, lessonSlug)
  return c.json({ data })
})

lessonsApp.post(
  '/:courseSlug/:lessonSlug/mark-completed',
  requireAuth,
  requireNotBanned,
  markLessonAsCompletedDesc,
  validator('param', courseLessonParamSchema),
  async (c) => {
    const user = c.get('user')
    const { courseSlug, lessonSlug } = c.req.valid('param')
    const lesson = await LessonsService.getLesson(courseSlug, lessonSlug)

    if (lesson.type !== 'lecture') {
      throw new AppError(400, 'Only lectures can be marked as completed')
    }

    const access = await CoursePrerequisitesService.checkCourseAccess(user.id, courseSlug)
    if (!access.allowed) throw new AppError(403, `Course locked: complete "${access.prerequisiteCourseTitle}" first`)

    await LessonsService.markLessonAsCompleted(user.id, courseSlug, lessonSlug)
    return c.json({ success: true })
  },
)

export type LessonsAppType = typeof lessonsApp

export default lessonsApp
