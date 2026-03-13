import { describeRoute, resolver } from 'hono-openapi'
import { z } from 'zod'
import { errorSchema } from './schemas'

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
