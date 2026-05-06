import { z } from 'zod'
import { paginationQueryShape } from '../shared/pagination'
import { slugField } from '../shared/slug'

export const adminUsersQuerySchema = z.object({
  ...paginationQueryShape,
  sortBy: z.enum(['email', 'name', 'username', 'createdAt', 'lessonsPassed', 'coursesPassed']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  search: z.string().trim().min(1).max(100).optional(),
})

export const adminCertificatesQuerySchema = z.object({
  ...paginationQueryShape,
  sortBy: z.enum(['issuedAt', 'userEmail', 'courseSlug', 'status', 'name']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  status: z.enum(['all', 'created', 'requested', 'claimed']).optional(),
  search: z.string().trim().min(1).max(100).optional(),
})

export const adminUserIdParamSchema = z.object({
  userId: z.string().min(1).max(255),
})

export const adminUserLessonParamSchema = z.object({
  userId: z.string().min(1).max(255),
  courseSlug: slugField,
  lessonSlug: slugField,
})

export const banUserBodySchema = z.object({ ban: z.boolean() })

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>
export type AdminCertificatesQuery = z.infer<typeof adminCertificatesQuerySchema>
export type AdminUserIdParam = z.infer<typeof adminUserIdParamSchema>
export type AdminUserLessonParam = z.infer<typeof adminUserLessonParamSchema>
export type BanUserBody = z.infer<typeof banUserBodySchema>
