import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { getLessonDesc, markLessonAsCompletedDesc, submitCodingTaskDesc, submitProjectDesc, submitTestDesc } from '../../descriptions/lessons'
import { requireAuth, getClientIp } from '../../lib/middleware'
import { courseLessonParamSchema } from '../../lib/schemas'
import type { AuthVariables } from '../../lib/types'
import { AppError } from '../../lib/errors'
import { CoursesTestService } from '../courses/courses-test.service'
import { ReviewService } from '../review/review.service'
import { CodingTaskService } from '../coding-task/coding-task.service'
import { LessonsService } from './lessons.service'
import { CoursePrerequisitesService } from '../courses/course-prerequisites.service'

const slugField = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Must be lowercase letters, numbers, or hyphens')

const submitTestBodySchema = z.object({
  courseSlug: slugField,
  lessonSlug: slugField,
  answers: z
    .record(
      z.string().min(1).max(64),
      z.array(z.string().max(64)).max(10),
    )
    .refine((r) => Object.keys(r).length <= 50, 'Too many answer keys'),
})

const submitProjectBodySchema = z.object({
  courseSlug: slugField,
  lessonSlug: slugField,
  repoUrl: z.string().url(),
})

const submitCodingTaskBodySchema = z.object({
  courseSlug: slugField,
  lessonSlug: slugField,
  code: z.string().min(1).max(100_000),
  language: z.enum(['solidity', 'rust', 'typescript']),
})

const lessonsApp = new Hono<{ Variables: AuthVariables }>()

lessonsApp.post('/submit-test', requireAuth, submitTestDesc, validator('json', submitTestBodySchema), async (c) => {
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
  submitProjectDesc,
  validator('json', submitProjectBodySchema),
  async (c) => {
    const user = c.get('user')
    const { courseSlug, lessonSlug, repoUrl } = c.req.valid('json')
    const access = await CoursePrerequisitesService.checkCourseAccess(user.id, courseSlug)
    if (!access.allowed) throw new AppError(403, `Course locked: complete "${access.prerequisiteCourseTitle}" first`)
    const ipAddress = getClientIp(c)
    await ReviewService.submitProject(user.id, courseSlug, lessonSlug, repoUrl, ipAddress)
    return c.json({ success: true })
  },
)

lessonsApp.post(
  '/submit-coding-task',
  requireAuth,
  submitCodingTaskDesc,
  validator('json', submitCodingTaskBodySchema),
  async (c) => {
    const user = c.get('user')
    const { courseSlug, lessonSlug, code, language } = c.req.valid('json')
    const access = await CoursePrerequisitesService.checkCourseAccess(user.id, courseSlug)
    if (!access.allowed) throw new AppError(403, `Course locked: complete "${access.prerequisiteCourseTitle}" first`)
    const ipAddress = getClientIp(c)
    const result = await CodingTaskService.submitCode(user.id, courseSlug, lessonSlug, code, language, ipAddress)
    return c.json(result)
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
