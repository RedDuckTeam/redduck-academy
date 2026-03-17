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
  description:
    'Returns the list of completed lessons with courseSlug, lessonSlug, points earned, and max points.',
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
    'Returns lesson data with user-specific fields: earnedPoints, userAnswers, isCompleted, correctAnswers (for completed tests).',
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

export const getUserStatsDesc = describeRoute({
  summary: 'Get user stats',
  description:
    'Returns the authenticated user stats (points and completed lessons count).',
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
