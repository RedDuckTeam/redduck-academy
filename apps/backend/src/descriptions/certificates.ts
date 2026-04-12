import { describeRoute, resolver } from 'hono-openapi'
import { z } from 'zod'
import { errorSchema } from './schemas'

export const NAME_MAX_LENGTH = 42

const certificateSchema = z.object({
  id: z.string().uuid(),
  courseSlug: z.string(),
  issuedAt: z.string(),
  name: z.string(),
})

export type Certificate = z.infer<typeof certificateSchema>

export const claimCertificateBodySchema = z.object({
  name: z.string().min(1).max(NAME_MAX_LENGTH),
})

export const claimCertificateDesc = describeRoute({
  summary: 'Claim a course certificate',
  description:
    'Issues a certificate for the authenticated user if all non-lecture lessons in the course are completed. Returns 409 if already claimed, 403 if not all lessons are completed.',
  tags: ['Certificates'],
  responses: {
    200: {
      description: 'Certificate issued',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: certificateSchema })),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    403: {
      description: 'Not all lessons completed',
      content: { 'application/json': { schema: errorSchema } },
    },
    404: {
      description: 'Course not found',
      content: { 'application/json': { schema: errorSchema } },
    },
    409: {
      description: 'Certificate already claimed',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const getCertificateByIdDesc = describeRoute({
  summary: 'Get a certificate by ID',
  description: 'Public endpoint. Returns the certificate data including the course title for display.',
  tags: ['Certificates'],
  responses: {
    200: {
      description: 'Certificate data',
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              data: certificateSchema.extend({ courseTitle: z.string() }),
            }),
          ),
        },
      },
    },
    404: {
      description: 'Certificate not found',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const getUserCertificatesDesc = describeRoute({
  summary: 'Get user certificates',
  description: 'Returns all certificates claimed by the authenticated user.',
  tags: ['Certificates'],
  responses: {
    200: {
      description: 'List of certificates',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: z.array(certificateSchema) })),
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
