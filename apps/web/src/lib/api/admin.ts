import { api } from './fetcher'

export type AdminStats = {
  totalUsers: number
  totalLessonCompletions: number
  averageLessonsPerUser: number
  activeLearners: number
  totalCertificates: number
}

export type AdminUserRow = {
  email: string
  name: string
  isPrivate: boolean
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
  if (!response.data && response.status >= 400) {
    throw new Error(response.error ?? 'Failed to load admin stats')
  }
  return response.data!.data
}

export const getAdminUsers = async (input: {
  page: number
  pageSize?: number
  sortBy?: 'email' | 'name' | 'lessonsPassed' | 'coursesPassed'
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
  if (!response.data && response.status >= 400) {
    throw new Error(response.error ?? 'Failed to load users')
  }
  return response.data!.data
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
  if (!response.data && response.status >= 400) {
    throw new Error(response.error ?? 'Failed to load certificates')
  }
  return response.data!.data
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
  if (!response.data && response.status >= 400) {
    throw new Error(response.error ?? 'Failed to generate certificate')
  }
  return response.data!.data
}

export const markAdminClaimed = async (
  certificateId: string,
  data: { metadataUri: string; imageUrl: string; tokenId: string; txHash: string },
): Promise<void> => {
  const response = await api({ credentials: 'include' }).post(
    `/api/certificates/admin/${certificateId}/claim`,
    data,
  )
  if (response.status >= 400) {
    throw new Error((response as { error?: string }).error ?? 'Failed to mark certificate as claimed')
  }
}
