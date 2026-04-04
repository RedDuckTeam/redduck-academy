import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { requireAuth } from '../../lib/middleware'
import { courseLessonParamSchema } from '../../lib/schemas'
import type { AuthVariables } from '../../lib/types'
import {
  getUserStatsDesc,
  getUserCompletedLessonsDesc,
  getUserLessonDesc,
  syncProjectReviewDesc,
} from '../../descriptions/user'
import { ReviewService } from '../review/review.service'
import { UserService } from './user.service'

const userApp = new Hono<{ Variables: AuthVariables }>()

userApp.get(
  '/lessons/:courseSlug/:lessonSlug',
  requireAuth,
  getUserLessonDesc,
  validator('param', courseLessonParamSchema),
  async (c) => {
    const authUser = c.get('user')
    const { courseSlug, lessonSlug } = c.req.valid('param')
    const data = await UserService.getLessonForUser(authUser.id, courseSlug, lessonSlug)
    return c.json({ data })
  },
)

userApp.post(
  '/lessons/:courseSlug/:lessonSlug/sync-project-review',
  requireAuth,
  syncProjectReviewDesc,
  validator('param', courseLessonParamSchema),
  async (c) => {
    const authUser = c.get('user')
    const { courseSlug, lessonSlug } = c.req.valid('param')
    await ReviewService.syncProjectReview(authUser.id, courseSlug, lessonSlug)
    return c.body(null, 204)
  },
)

userApp.get('/completed-lessons', requireAuth, getUserCompletedLessonsDesc, async (c) => {
  const authUser = c.get('user')
  const data = await UserService.getUserCompletedLessons(authUser.id)
  return c.json({ data })
})

userApp.get('/stats', requireAuth, getUserStatsDesc, async (c) => {
  const authUser = c.get('user')
  const data = await UserService.getUserStats(authUser.id)
  return c.json({ data })
})

export type UserAppType = typeof userApp

export default userApp
