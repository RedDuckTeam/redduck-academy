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
  const response = await api({ credentials: 'include' }).get<{ data: AdminStats }>('/api/admin/stats')
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
  const response = await api({ credentials: 'include' }).get<{ data: AdminUsersPage }>(
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
  const response = await api({ credentials: 'include' }).get<{ data: AdminCertificatesPage }>(
    `/api/admin/certificates?${qs.toString()}`,
  )
  return response.data
}

export type AdminMintParams = {
  certificateId: string | null
  walletAddress: string
  courseId: number
  metadataHash: string
  metadataUri: string
  imageUrl: string
}

export const generateAdminCertificate = async (input: {
  userId: string
  courseSlug: string
}): Promise<AdminMintParams> => {
  const response = await api({ credentials: 'include' }).post<{ data: AdminMintParams }>(
    '/api/certificates/admin/generate',
    input,
  )
  return response.data
}

export const getAdminUserCompletedLessons = async (userId: string): Promise<CompletedLesson[]> => {
  const response = await api({ credentials: 'include' }).get<{ data: CompletedLesson[] }>(
    `/api/admin/users/${userId}/completed-lessons`,
  )
  return response.data
}

export const getAdminUserLessonDetail = async (
  userId: string,
  courseSlug: string,
  lessonSlug: string,
): Promise<LessonForUser> => {
  const response = await api({ credentials: 'include' }).get<{ data: LessonForUser }>(
    `/api/admin/users/${userId}/lessons/${courseSlug}/${lessonSlug}`,
  )
  return response.data
}

export const banAdminUser = async (userId: string, ban: boolean): Promise<{ blacklisted: boolean }> => {
  const response = await api({ credentials: 'include' }).patch<{ data: { blacklisted: boolean } }>(
    `/api/admin/users/${userId}/ban`,
    { ban },
  )
  return response.data
}

export const markAdminClaimed = async (
  certificateId: string,
  data: { metadataUri: string; imageUrl: string; tokenId: string; txHash: string },
): Promise<void> => {
  await api({ credentials: 'include' }).post(`/api/certificates/admin/${certificateId}/claim`, data)
}
