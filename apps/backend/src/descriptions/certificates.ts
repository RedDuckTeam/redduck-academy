import { describeRoute, resolver } from 'hono-openapi'
import { z } from 'zod'
import { errorSchema } from './schemas'

const certificateSchema = z.object({
  id: z.string().uuid(),
  humanId: z.string(),
  courseSlug: z.string(),
  issuedAt: z.string(),
  name: z.string(),
  status: z.enum(['created', 'requested', 'claimed']),
  metadataUri: z.string().nullable(),
  imageUrl: z.string().nullable(),
  tokenId: z.string().nullable(),
  txHash: z.string().nullable(),
  walletAddress: z.string().nullable(),
})

export const requestNftBodySchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM address (0x + 40 hex chars)'),
})

export const certificateIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const certificateHumanIdParamSchema = z.object({
  id: z.string().regex(/^RD-[0-9A-HJKMNP-TV-Z]{8}$/, 'Invalid certificate ID'),
})

export const certificateCourseSlugParamSchema = z.object({
  courseSlug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'courseSlug must be lowercase letters, numbers, or hyphens'),
})

export type Certificate = z.infer<typeof certificateSchema>

export const claimCertificateBodySchema = z.object({})

export const claimCertificateDesc = describeRoute({
  summary: 'Create a course certificate',
  description:
    'Creates a certificate (status: created) for the authenticated user if all non-lecture lessons are completed. If a certificate with the same name already exists for this course, returns it. Returns 403 if not all lessons are completed.',
  tags: ['Certificates'],
  responses: {
    200: {
      description: 'Certificate created',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: certificateSchema })),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Not all lessons completed', content: { 'application/json': { schema: errorSchema } } },
    404: { description: 'Course not found', content: { 'application/json': { schema: errorSchema } } },
    500: { description: 'Server error', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const requestNftDesc = describeRoute({
  summary: 'Request NFT minting for a certificate',
  description: 'Changes the certificate status from created to requested. Admin will see this and mint the NFT.',
  tags: ['Certificates'],
  responses: {
    200: {
      description: 'Status updated to requested',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: certificateSchema })),
        },
      },
    },
    400: { description: 'Certificate already claimed', content: { 'application/json': { schema: errorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorSchema } } },
    404: { description: 'Certificate not found', content: { 'application/json': { schema: errorSchema } } },
    500: { description: 'Server error', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const adminMarkClaimedBodySchema = z.object({
  metadataUri: z.string().url(),
  imageUrl: z.string().url(),
  tokenId: z.string().min(1).max(78),
  txHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Must be a valid transaction hash (0x + 64 hex chars)')
    .optional(),
})

export const adminMarkClaimedDesc = describeRoute({
  summary: 'Mark a certificate as claimed (admin)',
  description: 'After minting the NFT on-chain, call this to record the token ID, tx hash, and R2 asset URLs and set status to claimed.',
  tags: ['Certificates'],
  responses: {
    200: {
      description: 'Certificate marked as claimed',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: certificateSchema })),
        },
      },
    },
    404: { description: 'Certificate not found', content: { 'application/json': { schema: errorSchema } } },
    500: { description: 'Server error', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const getCertificateByIdDesc = describeRoute({
  summary: 'Get a certificate by ID',
  description: 'Public endpoint. Returns certificate data including the course title.',
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
    404: { description: 'Certificate not found', content: { 'application/json': { schema: errorSchema } } },
    500: { description: 'Server error', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const adminGenerateCertificateBodySchema = z.object({
  userId: z.string().min(1).max(255),
  courseSlug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Must be lowercase letters, numbers, or hyphens'),
  // Client-rendered JPEG/PNG as a data URL. Omit on the first call to receive
  // a `needs-image` response with the data the client needs to render it.
  imageDataUrl: z.string().min(1).max(8_000_000).optional(),
})

const mintParamsSchema = z.object({
  state: z.literal('ready'),
  certificateId: z.string().uuid().nullable(),
  metadataUri: z.string(),
  metadataHash: z.string(),
  walletAddress: z.string(),
  imageUrl: z.string(),
  courseId: z.number(),
})

const needsImageSchema = z.object({
  state: z.literal('needs-image'),
  certificateId: z.string().uuid().nullable(),
  walletAddress: z.string(),
  courseId: z.number(),
  userName: z.string(),
  humanId: z.string(),
  courseTitle: z.string(),
})

export const adminGenerateCertificateDesc = describeRoute({
  summary: 'Generate certificate assets (admin)',
  description:
    'Validates wallet + course completion. If cached assets exist, returns them. If `imageDataUrl` is provided, uploads it + JSON metadata to R2 and returns mint params. Otherwise returns `needs-image` with the render payload the client must use to produce the image, then call this endpoint again with `imageDataUrl`.',
  tags: ['Certificates'],
  responses: {
    200: {
      description: 'Cached, ready-to-mint, or needs-image',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: z.union([mintParamsSchema, needsImageSchema]) })),
        },
      },
    },
    400: { description: 'Missing/invalid wallet or image', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'User has not completed all lessons', content: { 'application/json': { schema: errorSchema } } },
    404: { description: 'User or course not found', content: { 'application/json': { schema: errorSchema } } },
    500: { description: 'Server error', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const getUserCertificatesDesc = describeRoute({
  summary: 'Get user certificates',
  description: 'Returns all certificates for the authenticated user.',
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
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
    500: { description: 'Server error', content: { 'application/json': { schema: errorSchema } } },
  },
})
