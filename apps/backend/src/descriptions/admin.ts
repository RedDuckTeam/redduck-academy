import { describeRoute, resolver } from 'hono-openapi'
import { z } from 'zod'
import {
  adminCertificatesListSchema,
  adminLessonProgressOverlaySchema,
  adminStatsSchema,
  adminUsersListSchema,
  banUserResponseDataSchema,
  completedLessonSchema,
} from '@redduck/api-contracts'
import { errorSchema } from './schemas'

export const adminHealthDesc = describeRoute({
  summary: 'Admin health check',
  tags: ['Admin'],
  responses: {
    200: { description: 'OK' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
})

export const adminStatsDesc = describeRoute({
  summary: 'Admin platform statistics',
  description:
    'Aggregates over all users (including private profiles): user count, completed lesson rows, average lessons per user, learners with at least one completed lesson, and certificate rows.',
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Stats payload',
      content: { 'application/json': { schema: resolver(z.object({ data: adminStatsSchema })) } },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const adminCertificatesDesc = describeRoute({
  summary: 'Admin certificates list (paginated)',
  description:
    'Paginated list of all certificate rows joined with user info. Sorted: requested status first, then by issuedAt descending. Includes certsForCourse count to detect name-change re-requests.',
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Certificates page',
      content: { 'application/json': { schema: resolver(z.object({ data: adminCertificatesListSchema })) } },
    },
    400: { description: 'Invalid pagination', content: { 'application/json': { schema: errorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const adminUserCompletedLessonsDesc = describeRoute({
  summary: 'Admin: get completed lessons for a user',
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Completed lessons',
      content: { 'application/json': { schema: resolver(z.object({ data: z.array(completedLessonSchema) })) } },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const adminUserLessonDetailDesc = describeRoute({
  summary: 'Admin: get lesson detail with user progress',
  description: 'Returns lesson data with user answers and submissions. No prerequisite enforcement. Review feedback is not sanitized; coding-task aiComment is included.',
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Lesson data with user progress',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: adminLessonProgressOverlaySchema.passthrough() })),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorSchema } } },
    404: { description: 'Lesson not found', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const adminUsersDesc = describeRoute({
  summary: 'Admin users list (paginated)',
  description:
    'Paginated list of all users ordered by email. Includes completed lesson count and certificate row count per user.',
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Users page',
      content: { 'application/json': { schema: resolver(z.object({ data: adminUsersListSchema })) } },
    },
    400: { description: 'Invalid pagination', content: { 'application/json': { schema: errorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const adminBanUserDesc = describeRoute({
  summary: 'Admin: ban or unban a user',
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Updated ban status',
      content: { 'application/json': { schema: resolver(z.object({ data: banUserResponseDataSchema })) } },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: errorSchema } } },
  },
})
