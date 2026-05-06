import { z } from 'zod'
import { paginatedDataSchema } from '../shared/pagination'
import {
  adminCodingTaskSubmissionSchema,
  adminProjectSubmissionSchema,
} from '../review/submissions'

export const adminStatsSchema = z.object({
  totalUsers: z.number().int(),
  totalLessonCompletions: z.number().int(),
  averageLessonsPerUser: z.number(),
  activeLearners: z.number().int(),
  totalCertificates: z.number().int(),
})

export const adminUserItemSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  name: z.string(),
  username: z.string().nullable(),
  image: z.string().nullable(),
  role: z.enum(['user', 'admin']),
  isPrivate: z.boolean(),
  blacklisted: z.boolean(),
  createdAt: z.string(),
  lessonsPassed: z.number().int(),
  coursesPassed: z.number().int(),
})

export const adminCertificateItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  userEmail: z.string().nullable(),
  userName: z.string(),
  courseSlug: z.string(),
  name: z.string(),
  status: z.enum(['created', 'requested', 'claimed']),
  issuedAt: z.string(),
  certsForCourse: z.number().int(),
  metadataUri: z.string().nullable(),
  imageUrl: z.string().nullable(),
  tokenId: z.string().nullable(),
  txHash: z.string().nullable(),
})

export const adminUsersListSchema = paginatedDataSchema(adminUserItemSchema)
export const adminCertificatesListSchema = paginatedDataSchema(adminCertificateItemSchema)

/** Admin lesson detail attaches richer submission info (full feedback + ai notes). */
export const adminLessonSubmissionsSchema = z.union([
  z.array(adminProjectSubmissionSchema),
  z.array(adminCodingTaskSubmissionSchema),
])

export const adminLessonProgressOverlaySchema = z.object({
  userAnswers: z.record(z.string(), z.array(z.string())).nullable(),
  isCompleted: z.boolean(),
  correctAnswers: z.record(z.string(), z.array(z.string())).nullable(),
  submissions: adminLessonSubmissionsSchema.optional(),
})

export const banUserResponseDataSchema = z.object({ blacklisted: z.boolean() })

export type AdminStats = z.infer<typeof adminStatsSchema>
export type AdminUserItem = z.infer<typeof adminUserItemSchema>
export type AdminCertificateItem = z.infer<typeof adminCertificateItemSchema>
export type AdminLessonProgressOverlay = z.infer<typeof adminLessonProgressOverlaySchema>
