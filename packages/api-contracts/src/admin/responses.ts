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

export const setUserPrivacyResponseDataSchema = z.object({ isPrivate: z.boolean() })

export const adminLessonTreeLessonSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  slug: z.string(),
  type: z.enum(['lecture', 'test', 'coding_task', 'review_task']),
  order: z.number(),
  completedCount: z.number().int(),
  totalAttempts: z.number().int(),
  successAttempts: z.number().int(),
})

export const adminLessonTreeModuleSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  slug: z.string().nullable(),
  order: z.number(),
  lessons: z.array(adminLessonTreeLessonSchema),
})

export const adminLessonTreeCourseSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  slug: z.string(),
  order: z.number(),
  modules: z.array(adminLessonTreeModuleSchema),
})

export const adminLessonsTreeSchema = z.array(adminLessonTreeCourseSchema)

export const adminLessonSubmissionItemSchema = z.object({
  id: z.string(),
  kind: z.enum(['lecture', 'test', 'coding_task', 'review_task']),
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string().nullable(),
  userImage: z.string().nullable(),
  username: z.string().nullable(),
  submittedAt: z.string(),
  passed: z.boolean().nullable(),
  status: z.string().nullable(),
})

export const adminLessonSubmissionsListSchema = paginatedDataSchema(adminLessonSubmissionItemSchema).extend({
  lesson: z.object({
    id: z.number().int(),
    title: z.string(),
    slug: z.string(),
    type: z.enum(['lecture', 'test', 'coding_task', 'review_task']),
    courseSlug: z.string(),
    courseTitle: z.string(),
  }),
})

// ─── AI cost dashboard ────────────────────────────────────────────────────────
// All `cost` values are estimated USD (derived from token counts via a hardcoded
// pricing map). Treat as relative attribution, not an exact invoice figure.

export const adminAiCostSummarySchema = z.object({
  today: z.number(), // since UTC midnight
  last7d: z.number(),
  last30d: z.number(),
  allTime: z.number(),
  totalCalls: z.number().int(),
})

export const adminAiCostModelSchema = z.object({
  model: z.string(),
  cost: z.number(),
  calls: z.number().int(),
  totalTokens: z.number().int(),
})

export const adminAiCostLessonSchema = z.object({
  lessonId: z.number().int(),
  title: z.string(),
  slug: z.string(),
  type: z.string(),
  cost: z.number(),
  calls: z.number().int(),
})

export const adminAiCostCourseSchema = z.object({
  courseId: z.number().int().nullable(),
  courseTitle: z.string(),
  courseSlug: z.string(),
  cost: z.number(),
  lessons: z.array(adminAiCostLessonSchema),
})

export const adminAiCostUserSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string().nullable(),
  username: z.string().nullable(),
  cost: z.number(),
  calls: z.number().int(),
})

export const adminAiCostsSchema = z.object({
  // The pricing-map version the cost estimates were computed against.
  pricingVersion: z.string(),
  summary: adminAiCostSummarySchema,
  byModel: z.array(adminAiCostModelSchema),
  courses: z.array(adminAiCostCourseSchema), // course → lesson drill-down, sorted by cost desc
  topUsers: z.array(adminAiCostUserSchema),
})

export type AdminAiCosts = z.infer<typeof adminAiCostsSchema>

export type AdminStats = z.infer<typeof adminStatsSchema>
export type AdminUserItem = z.infer<typeof adminUserItemSchema>
export type AdminCertificateItem = z.infer<typeof adminCertificateItemSchema>
export type AdminLessonProgressOverlay = z.infer<typeof adminLessonProgressOverlaySchema>
export type AdminLessonTreeLesson = z.infer<typeof adminLessonTreeLessonSchema>
export type AdminLessonTreeModule = z.infer<typeof adminLessonTreeModuleSchema>
export type AdminLessonTreeCourse = z.infer<typeof adminLessonTreeCourseSchema>
export type AdminLessonsTree = z.infer<typeof adminLessonsTreeSchema>
export type AdminLessonSubmissionItem = z.infer<typeof adminLessonSubmissionItemSchema>
export type AdminLessonSubmissionsList = z.infer<typeof adminLessonSubmissionsListSchema>
