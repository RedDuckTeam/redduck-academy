import { api } from './fetcher'
import type { LessonForUser } from '@/types/lesson'
import type { CompletedLesson } from './user'

export type AdminStats = {
  totalUsers: number
  totalLessonCompletions: number
  averageLessonsPerUser: number
  activeLearners: number
  totalCertificates: number
}

export type AdminUserRow = {
  id: string
  email: string
  name: string
  username: string | null
  image: string | null
  role: 'user' | 'admin'
  isPrivate: boolean
  blacklisted: boolean
  createdAt: string
  lessonsPassed: number
  coursesPassed: number
}

export type AdminUsersPage = {
  items: AdminUserRow[]
  total: number
  page: number
  pageSize: number
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api().get<{ data: AdminStats }>('/api/admin/stats')
  return response.data
}

export const getAdminUsers = async (input: {
  page: number
  pageSize?: number
  sortBy?: 'email' | 'name' | 'username' | 'createdAt' | 'lessonsPassed' | 'coursesPassed'
  sortDir?: 'asc' | 'desc'
  search?: string
}): Promise<AdminUsersPage> => {
  const pageSize = input.pageSize ?? 50
  const qs = new URLSearchParams({ page: String(input.page), pageSize: String(pageSize) })
  if (input.sortBy) qs.set('sortBy', input.sortBy)
  if (input.sortDir) qs.set('sortDir', input.sortDir)
  if (input.search) qs.set('search', input.search)
  const response = await api().get<{ data: AdminUsersPage }>(
    `/api/admin/users?${qs.toString()}`,
  )
  return response.data
}

export type AdminCertificateRow = {
  id: string
  userId: string
  userEmail: string
  userName: string
  courseSlug: string
  name: string
  status: 'created' | 'requested' | 'claimed'
  issuedAt: string
  certsForCourse: number
  metadataUri: string | null
  imageUrl: string | null
  tokenId: string | null
  txHash: string | null
}

export type AdminCertificatesPage = {
  items: AdminCertificateRow[]
  total: number
  page: number
  pageSize: number
}

export const getAdminCertificates = async (input: {
  page: number
  pageSize?: number
  sortBy?: 'issuedAt' | 'userEmail' | 'courseSlug' | 'status' | 'name'
  sortDir?: 'asc' | 'desc'
  status?: 'all' | 'created' | 'requested' | 'claimed'
  search?: string
}): Promise<AdminCertificatesPage> => {
  const pageSize = input.pageSize ?? 50
  const qs = new URLSearchParams({ page: String(input.page), pageSize: String(pageSize) })
  if (input.sortBy) qs.set('sortBy', input.sortBy)
  if (input.sortDir) qs.set('sortDir', input.sortDir)
  if (input.status && input.status !== 'all') qs.set('status', input.status)
  if (input.search) qs.set('search', input.search)
  const response = await api().get<{ data: AdminCertificatesPage }>(
    `/api/admin/certificates?${qs.toString()}`,
  )
  return response.data
}

export type AdminMintParams = {
  state: 'ready'
  certificateId: string | null
  walletAddress: string
  courseId: number
  metadataHash: string
  metadataUri: string
  imageUrl: string
}

export type AdminCertificateNeedsImage = {
  state: 'needs-image'
  certificateId: string | null
  walletAddress: string
  courseId: number
  userName: string
  humanId: string
  courseTitle: string
}

export type AdminGenerateCertificateResult = AdminMintParams | AdminCertificateNeedsImage

export const generateAdminCertificate = async (input: {
  userId: string
  courseSlug: string
  imageDataUrl?: string
}): Promise<AdminGenerateCertificateResult> => {
  const response = await api().post<{ data: AdminGenerateCertificateResult }>(
    '/api/certificates/admin/generate',
    input,
  )
  return response.data
}

export const getAdminUserCompletedLessons = async (userId: string): Promise<CompletedLesson[]> => {
  const response = await api().get<{ data: CompletedLesson[] }>(
    `/api/admin/users/${userId}/completed-lessons`,
  )
  return response.data
}

export const getAdminUserLessonDetail = async (
  userId: string,
  courseSlug: string,
  lessonSlug: string,
): Promise<LessonForUser> => {
  const response = await api().get<{ data: LessonForUser }>(
    `/api/admin/users/${userId}/lessons/${courseSlug}/${lessonSlug}`,
  )
  return response.data
}

export const banAdminUser = async (userId: string, ban: boolean): Promise<{ blacklisted: boolean }> => {
  const response = await api().patch<{ data: { blacklisted: boolean } }>(
    `/api/admin/users/${userId}/ban`,
    { ban },
  )
  return response.data
}

export const setAdminUserPrivacy = async (userId: string, isPrivate: boolean): Promise<{ isPrivate: boolean }> => {
  const response = await api().patch<{ data: { isPrivate: boolean } }>(
    `/api/admin/users/${userId}/privacy`,
    { isPrivate },
  )
  return response.data
}

export type AdminLessonTreeLesson = {
  id: number
  title: string
  slug: string
  type: 'lecture' | 'test' | 'coding_task' | 'review_task'
  order: number
  completedCount: number
  totalAttempts: number
  successAttempts: number
}

export type AdminLessonTreeModule = {
  id: number
  title: string
  slug: string | null
  order: number
  lessons: AdminLessonTreeLesson[]
}

export type AdminLessonTreeCourse = {
  id: number
  title: string
  slug: string
  order: number
  modules: AdminLessonTreeModule[]
}

export const getAdminLessonsTree = async (): Promise<AdminLessonTreeCourse[]> => {
  const response = await api().get<{ data: AdminLessonTreeCourse[] }>('/api/admin/lessons/tree')
  return response.data
}

export type AdminLessonSubmissionItem = {
  id: string
  kind: 'lecture' | 'test' | 'coding_task' | 'review_task'
  userId: string
  userName: string
  userEmail: string | null
  userImage: string | null
  username: string | null
  submittedAt: string
  passed: boolean | null
  status: string | null
}

export type AdminLessonSubmissionsPage = {
  items: AdminLessonSubmissionItem[]
  total: number
  page: number
  pageSize: number
  lesson: {
    id: number
    title: string
    slug: string
    type: 'lecture' | 'test' | 'coding_task' | 'review_task'
    courseSlug: string
    courseTitle: string
  }
}

export const getAdminLessonSubmissions = async (input: {
  courseSlug: string
  lessonSlug: string
  page: number
  pageSize?: number
  search?: string
}): Promise<AdminLessonSubmissionsPage> => {
  const pageSize = input.pageSize ?? 20
  const qs = new URLSearchParams({ page: String(input.page), pageSize: String(pageSize) })
  if (input.search) qs.set('search', input.search)
  const response = await api().get<{ data: AdminLessonSubmissionsPage }>(
    `/api/admin/lessons/${input.courseSlug}/${input.lessonSlug}/submissions?${qs.toString()}`,
  )
  return response.data
}

export const markAdminClaimed = async (
  certificateId: string,
  data: { metadataUri: string; imageUrl: string; tokenId: string; txHash: string },
): Promise<void> => {
  await api().post(`/api/certificates/admin/${certificateId}/claim`, data)
}

// ─── AI cost dashboard ──────────────────────────────────────────────────────
// `cost` values are estimated USD (token counts × pricing map), not the exact invoice.

export type AdminAiCostSummary = {
  today: number
  last7d: number
  last30d: number
  allTime: number
  totalCalls: number
}

export type AdminAiCostModel = { model: string; cost: number; calls: number; totalTokens: number }

export type AdminAiCostLesson = {
  lessonId: number
  title: string
  slug: string
  type: string
  cost: number
  calls: number
}

export type AdminAiCostCourse = {
  courseId: number | null
  courseTitle: string
  courseSlug: string
  cost: number
  lessons: AdminAiCostLesson[]
}

export type AdminAiCostUser = {
  userId: string
  userName: string
  userEmail: string | null
  username: string | null
  cost: number
  calls: number
}

export type AdminAiCosts = {
  pricingVersion: string
  summary: AdminAiCostSummary
  byModel: AdminAiCostModel[]
  courses: AdminAiCostCourse[]
  topUsers: AdminAiCostUser[]
}

export const getAdminAiCosts = async (): Promise<AdminAiCosts> => {
  const response = await api().get<{ data: AdminAiCosts }>('/api/admin/ai-costs')
  return response.data
}
