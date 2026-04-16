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
  getProgressCardsDesc,
  updateUserNameDesc,
  updateUserNameBodySchema,
  getUserSettingsDesc,
  updateUserSettingsDesc,
  updateUserSettingsBodySchema,
  getRatingDesc,
  uploadAvatarDesc,
} from '../../descriptions/user'
import { ReviewService } from '../review/review.service'
import { UserService } from './user.service'
import { uploadToR2, deleteFromR2 } from '../../lib/r2'
import { AppError } from '../../lib/errors'
import { env } from '../../env'

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

userApp.get('/progress-cards', requireAuth, getProgressCardsDesc, async (c) => {
  const authUser = c.get('user')
  const data = await UserService.getProgressCards(authUser.id)
  return c.json({ data })
})

userApp.patch('/name', requireAuth, updateUserNameDesc, validator('json', updateUserNameBodySchema), async (c) => {
  const authUser = c.get('user')
  const { name } = c.req.valid('json')
  const data = await UserService.updateUserName(authUser.id, name)
  return c.json({ data })
})

userApp.get('/stats', requireAuth, getUserStatsDesc, async (c) => {
  const authUser = c.get('user')
  const data = await UserService.getUserStats(authUser.id)
  return c.json({ data })
})

userApp.get('/settings', requireAuth, getUserSettingsDesc, async (c) => {
  const authUser = c.get('user')
  const data = await UserService.getUserSettings(authUser.id)
  return c.json({ data })
})

userApp.patch(
  '/settings',
  requireAuth,
  updateUserSettingsDesc,
  validator('json', updateUserSettingsBodySchema),
  async (c) => {
    const authUser = c.get('user')
    const body = c.req.valid('json')
    const data = await UserService.updateUserSettings(authUser.id, body)
    return c.json({ data })
  },
)

const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

userApp.post('/avatar', requireAuth, uploadAvatarDesc, async (c) => {
  const authUser = c.get('user')

  const formData = await c.req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    throw new AppError(400, 'Missing file field')
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new AppError(400, 'Invalid file type. Allowed: jpeg, png, webp')
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new AppError(400, 'File exceeds 2 MB limit')
  }

  const existingImageUrl = await UserService.getUserImage(authUser.id)

  const ext = EXTENSIONS[file.type]
  const key = `avatars/${authUser.id}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const imageUrl = await uploadToR2(key, buffer, file.type)

  const data = await UserService.updateUserAvatar(authUser.id, imageUrl)

  if (existingImageUrl) {
    const oldKey = existingImageUrl.replace(`${env.R2_PUBLIC_URL}/`, '')
    if (oldKey.startsWith('avatars/')) {
      deleteFromR2(oldKey).catch(() => {})
    }
  }
  return c.json({ data })
})

userApp.get('/rating', getRatingDesc, async (c) => {
  const data = await UserService.getRating()
  return c.json({ data })
})

export type UserAppType = typeof userApp

export default userApp
