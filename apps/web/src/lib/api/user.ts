import { api } from './fetcher'
import { ApiError } from './errors'
import type { UserSettings, UserPublicProfile } from '@/types/lesson'

export interface ProgressCards {
  completedLessonsCount: number
  completedCoursesCount: number
  totalCoursesCount: number
  currentStreak: number
  placeInRanking: number
}

export const getProgressCards = async (): Promise<ProgressCards> => {
  const response = await api({ credentials: 'include' }).get<{ data: ProgressCards }>('/api/user/progress-cards')
  return response.data
}

export interface CompletedLesson {
  courseSlug: string
  lessonId: number
  lessonSlug: string
}

export const getCompletedLessons = async (): Promise<CompletedLesson[]> => {
  const response = await api({ credentials: 'include' }).get<{ data: CompletedLesson[] }>('/api/user/completed-lessons')
  return response.data ?? []
}

export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await api({ credentials: 'include' }).get<{ data: UserSettings }>('/api/user/settings')
  return response.data
}

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const response = await api({ credentials: 'include' }).patch<{ data: UserSettings }>('/api/user/settings', settings)
  return response.data
}

export const updateUserBio = async (bio: string | null): Promise<{ bio: string | null }> => {
  const response = await api({ credentials: 'include' }).patch<{ data: { bio: string | null } }>('/api/user/bio', {
    bio,
  })
  return response.data
}

export const updateUserName = async (name: string): Promise<{ name: string }> => {
  const response = await api({ credentials: 'include' }).patch<{ data: { name: string } }>('/api/user/name', { name })
  return response.data
}

export const updateUserUsername = async (username: string): Promise<{ username: string }> => {
  const response = await api({ credentials: 'include' }).patch<{ data: { username: string } }>('/api/user/username', {
    username,
  })
  return response.data
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

  const text = await response.text().catch(() => '')
  if (!response.ok) {
    const { parseApiError } = await import('./errors')
    throw parseApiError(response.status, response.statusText, text)
  }
  try {
    const data = JSON.parse(text) as { data: { imageUrl: string } }
    return data.data
  } catch {
    throw new ApiError('Invalid avatar upload response', response.status)
  }
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
  return response.data
}

export const getRating = async (): Promise<RatingEntry[]> => {
  const response = await api({ credentials: 'include' }).get<{ data: RatingEntry[] }>('/api/user/rating')
  return response.data ?? []
}
