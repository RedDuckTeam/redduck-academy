import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { requireAuth } from '../../lib/middleware'
import { getUserStatsDesc, getUserCompletedLessonsDesc, getUserLessonDesc } from '../../descriptions/user'
import { UserService } from './user.service'

type UserVariables = {
  user: { id: string }
  session: unknown
}

const userApp = new Hono<{ Variables: UserVariables }>()

const courseLessonParamSchema = z.object({
  courseSlug: z.string(),
  lessonSlug: z.string(),
})

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
