import { describeRoute, resolver } from 'hono-openapi'
import { z } from 'zod'
import { errorSchema } from './schemas'

const completedLessonSchema = z.object({
  courseSlug: z.string(),
  lessonId: z.number(),
  lessonSlug: z.string(),
})

export type CompletedLesson = z.infer<typeof completedLessonSchema>

export const getUserCompletedLessonsDesc = describeRoute({
  summary: 'Get user completed lessons',
  description: 'Returns the list of completed lessons with courseSlug and lessonSlug.',
  tags: ['User'],
  responses: {
    200: {
      description: 'Completed lessons with details',
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              data: z.array(completedLessonSchema),
            }),
          ),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const getUserLessonDesc = describeRoute({
  summary: 'Get lesson for authenticated user',
  description:
    'Returns lesson data with user-specific fields: userAnswers, isCompleted, correctAnswers (for completed tests). For review_task and coding_task lessons, also includes submissions (all attempts, oldest first; latest is the last element). Per-criterion feedback comments for hidden rubric rows are redacted in submissions so hints are not leaked.',
  tags: ['User'],
  responses: {
    200: {
      description: 'Lesson data with user progress',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: z.any() })),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    404: {
      description: 'Course or lesson not found',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const syncProjectReviewDesc = describeRoute({
  summary: 'Sync OpenAI batch review status',
  description:
    'For review_task lessons: polls OpenAI for the latest pending project submission batch. If the batch finished, downloads output, stores feedback, and updates lesson score/completion. Idempotent when nothing is pending.',
  tags: ['User'],
  responses: {
    204: {
      description: 'Sync finished; use GET lesson to read updated state.',
    },
    400: {
      description: 'Lesson is not a review task',
      content: { 'application/json': { schema: errorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    404: {
      description: 'Lesson not started or lesson not found',
      content: { 'application/json': { schema: errorSchema } },
    },
    503: {
      description: 'AI not configured',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const updateUserNameBodySchema = z.object({
  name: z.string().min(1).max(42),
})

export const updateUserNameDesc = describeRoute({
  summary: 'Update user name',
  description: 'Updates the display name for the authenticated user. Does not retroactively update names stored on issued certificates.',
  tags: ['User'],
  responses: {
    200: {
      description: 'Updated user name',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: z.object({ name: z.string() }) })),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const getProgressCardsDesc = describeRoute({
  summary: 'Get progress cards data',
  description: 'Returns progress data for the home page cards: completed lessons, completed courses, and current streak.',
  tags: ['User'],
  responses: {
    200: {
      description: 'Progress cards data',
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              data: z.object({
                completedLessonsCount: z.number(),
                completedCoursesCount: z.number(),
                totalCoursesCount: z.number(),
                currentStreak: z.number(),
              }),
            }),
          ),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const getUserStatsDesc = describeRoute({
  summary: 'Get user stats',
  description: 'Returns the authenticated user stats (completed lessons count).',
  tags: ['User'],
  responses: {
    200: {
      description: 'User stats',
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              data: z.object({
                completedLessonsCount: z.number(),
              }),
            }),
          ),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const userSettingsSchema = z.object({
  skipPrerequisites: z.boolean(),
  isPrivate: z.boolean(),
})

export const updateUserSettingsBodySchema = z.object({
  skipPrerequisites: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
})

export const getUserSettingsDesc = describeRoute({
  summary: 'Get user settings',
  description: 'Returns the authenticated user settings.',
  tags: ['User'],
  responses: {
    200: {
      description: 'User settings',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: userSettingsSchema })),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const getRatingDesc = describeRoute({
  summary: 'Get user rating',
  description:
    'Returns the ranking for all users sorted by completed lessons (descending). Users with the same number of completed lessons share the same rank (dense rank).',
  tags: ['User'],
  responses: {
    200: {
      description: 'User rating list',
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              data: z.array(
                z.object({
                  rank: z.number(),
                  userId: z.string(),
                  userName: z.string(),
                  completedLessonsCount: z.number(),
                  completedCoursesCount: z.number(),
                }),
              ),
            }),
          ),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const uploadAvatarDesc = describeRoute({
  summary: 'Upload user avatar',
  description: 'Accepts a multipart/form-data request with an image file (max 2 MB). Uploads the image to R2 and saves the public URL to the user record.',
  tags: ['User'],
  responses: {
    200: {
      description: 'Updated avatar URL',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: z.object({ imageUrl: z.string() }) })),
        },
      },
    },
    400: {
      description: 'Invalid file type or size exceeds 2 MB',
      content: { 'application/json': { schema: errorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const updateUserSettingsDesc = describeRoute({
  summary: 'Update user settings',
  description: 'Updates the authenticated user settings (e.g. skipPrerequisites, isPrivate).',
  tags: ['User'],
  responses: {
    200: {
      description: 'Updated settings',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: userSettingsSchema })),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})
