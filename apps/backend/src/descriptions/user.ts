import { describeRoute, resolver } from 'hono-openapi'
import { z } from 'zod'
import { errorSchema } from './schemas'

const completedLessonSchema = z.object({
  courseSlug: z.string(),
  lessonId: z.number(),
  lessonSlug: z.string(),
  pointsEarned: z.number(),
  maxPoints: z.number(),
})

export type CompletedLesson = z.infer<typeof completedLessonSchema>

export const getUserCompletedLessonsDesc = describeRoute({
  summary: 'Get user completed lessons',
  description: 'Returns the list of completed lessons with courseSlug, lessonSlug, points earned, and max points.',
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
    'Returns lesson data with user-specific fields: earnedPoints, userAnswers, isCompleted, correctAnswers (for completed tests). For review_task lessons, also attemptsLeft, reviewGradingTasks (learner-safe rubric rows), and submissions (all attempts, oldest first; latest is the last element). Per-criterion feedback comments for hidden rubric rows are redacted in submissions so hints are not leaked.',
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

export const getUserStatsDesc = describeRoute({
  summary: 'Get user stats',
  description: 'Returns the authenticated user stats (points and completed lessons count).',
  tags: ['User'],
  responses: {
    200: {
      description: 'User stats',
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              data: z.object({
                points: z.number(),
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
