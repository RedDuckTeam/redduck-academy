import { api } from './fetcher'
import type { UserSettings, UserPublicProfile } from '@/types/lesson'

export interface ProgressCards {
  completedLessonsCount: number
  completedCoursesCount: number
  totalCoursesCount: number
  currentStreak: number
  placeInRanking: number
}

interface GetProgressCardsResponse {
  data: ProgressCards
}

export const getProgressCards = async (): Promise<ProgressCards> => {
  const response = await api({ credentials: 'include' }).get<GetProgressCardsResponse>('/api/user/progress-cards')
  return response.data!.data
}

export interface CompletedLesson {
  courseSlug: string
  lessonId: number
  lessonSlug: string
}

export interface GetCompletedLessonsResponse {
  data: CompletedLesson[]
}

export const getCompletedLessons = async (): Promise<CompletedLesson[]> => {
  const response = await api({ credentials: 'include' }).get<GetCompletedLessonsResponse>('/api/user/completed-lessons')
  return response.data?.data ?? []
}

export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await api({ credentials: 'include' }).get<{ data: UserSettings }>('/api/user/settings')
  return response.data!.data
}

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const response = await api({ credentials: 'include' }).patch<{ data: UserSettings }>('/api/user/settings', settings)
  return response.data!.data
}

export const updateUserBio = async (bio: string | null): Promise<{ bio: string | null }> => {
  const response = await api({ credentials: 'include' }).patch<{ data: { bio: string | null } }>('/api/user/bio', {
    bio,
  })
  if (response.error) throw new Error(response.error)
  return response.data!.data
}

export const updateUserName = async (name: string): Promise<{ name: string }> => {
  const response = await api({ credentials: 'include' }).patch<{ data: { name: string } }>('/api/user/name', { name })
  if (response.error) throw new Error(response.error)
  return response.data!.data
}

export const updateUserUsername = async (username: string): Promise<{ username: string }> => {
  const response = await api({ credentials: 'include' }).patch<{ data: { username: string } }>('/api/user/username', {
    username,
  })
  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.data
}

export const uploadUserAvatar = async (file: File): Promise<{ imageUrl: string }> => {
  const { env } = await import('@/env')
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${env.VITE_API_URL}/api/user/avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? 'Failed to upload avatar')
  }

  const data = (await response.json()) as { data: { imageUrl: string } }
  return data.data
}

export interface RatingEntry {
  rank: number
  userId: string
  userName: string
  username: string | null
  completedLessonsCount: number
  completedCoursesCount: number
}

export const getPublicProfile = async (username: string): Promise<UserPublicProfile> => {
  const response = await api().get<{ data: UserPublicProfile }>(`/api/user/profile/${username}`)
  return response.data!.data
}

export const getRating = async (): Promise<RatingEntry[]> => {
  const response = await api({ credentials: 'include' }).get<{ data: RatingEntry[] }>('/api/user/rating')
  return response.data?.data ?? []
}
