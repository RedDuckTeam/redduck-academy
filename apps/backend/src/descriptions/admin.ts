import { describeRoute, resolver } from 'hono-openapi'
import { z } from 'zod'
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

const adminStatsDataSchema = z.object({
  totalUsers: z.number().int(),
  totalLessonCompletions: z.number().int(),
  averageLessonsPerUser: z.number(),
  activeLearners: z.number().int(),
  totalCertificates: z.number().int(),
})

export const adminStatsDesc = describeRoute({
  summary: 'Admin platform statistics',
  description:
    'Aggregates over all users (including private profiles): user count, completed lesson rows, average lessons per user, learners with at least one completed lesson, and certificate rows.',
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Stats payload',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: adminStatsDataSchema })),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['email', 'name', 'lessonsPassed', 'coursesPassed']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
})

const adminUserItemSchema = z.object({
  email: z.string(),
  name: z.string(),
  isPrivate: z.boolean(),
  lessonsPassed: z.number().int(),
  coursesPassed: z.number().int(),
})

export const adminCertificatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['issuedAt', 'userEmail', 'courseSlug', 'status', 'name']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  status: z.enum(['all', 'created', 'requested', 'claimed']).optional(),
  search: z.string().optional(),
})

const adminCertificateItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  userEmail: z.string(),
  userName: z.string(),
  courseSlug: z.string(),
  name: z.string(),
  status: z.enum(['created', 'requested', 'claimed']),
  issuedAt: z.string().datetime(),
  certsForCourse: z.number().int(),
  metadataUri: z.string().nullable(),
  imageUrl: z.string().nullable(),
  tokenId: z.string().nullable(),
  txHash: z.string().nullable(),
})

export const adminCertificatesDesc = describeRoute({
  summary: 'Admin certificates list (paginated)',
  description:
    'Paginated list of all certificate rows joined with user info. Sorted: requested status first, then by issuedAt descending. Includes certsForCourse count to detect name-change re-requests.',
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Certificates page',
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              data: z.object({
                items: z.array(adminCertificateItemSchema),
                total: z.number().int(),
                page: z.number().int(),
                pageSize: z.number().int(),
              }),
            }),
          ),
        },
      },
    },
    400: { description: 'Invalid pagination', content: { 'application/json': { schema: errorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorSchema } } },
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
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              data: z.object({
                items: z.array(adminUserItemSchema),
                total: z.number().int(),
                page: z.number().int(),
                pageSize: z.number().int(),
              }),
            }),
          ),
        },
      },
    },
    400: { description: 'Invalid pagination', content: { 'application/json': { schema: errorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorSchema } } },
  },
})
