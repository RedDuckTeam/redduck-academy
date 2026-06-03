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
import { cache } from '../../lib/cache'
import { cacheable } from '../../lib/cache/cacheable'
import { cacheControl } from '../../lib/cache/cache-control'

// RAM data cache (single-flighted) for public lesson content — no user data here.
const getLessonCached = cacheable(cache, 'lesson', { ttl: 600, staleTtl: 300 }, (courseSlug: string, lessonSlug: string) =>
  LessonsService.getLesson(courseSlug, lessonSlug),
)

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

// Public lesson content, NO user data here (user answers/progress live on /api/user/lessons/*).
lessonsApp.get(
  '/:courseSlug/:lessonSlug',
  getLessonDesc,
  validator('param', courseLessonParamSchema),
  cacheControl(600, 300),
  async (c) => {
    const { courseSlug, lessonSlug } = c.req.valid('param')
    const data = await getLessonCached(courseSlug, lessonSlug)
    return c.json({ data })
  },
)

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
