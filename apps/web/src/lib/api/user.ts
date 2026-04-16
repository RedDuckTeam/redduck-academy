import { api } from './fetcher'
import type { UserSettings } from '@/types/lesson'

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
  const response = await api({ credentials: 'include' }).get<GetProgressCardsResponse>(
    '/api/user/progress-cards',
  )
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
  const response = await api({ credentials: 'include' }).get<GetCompletedLessonsResponse>(
    '/api/user/completed-lessons',
  )
  return response.data?.data ?? []
}

export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await api({ credentials: 'include' }).get<{ data: UserSettings }>(
    '/api/user/settings',
  )
  return response.data!.data
}

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const response = await api({ credentials: 'include' }).patch<{ data: UserSettings }>(
    '/api/user/settings',
    settings,
  )
  return response.data!.data
}

export interface RatingEntry {
  rank: number
  userId: string
  userName: string
  completedLessonsCount: number
  completedCoursesCount: number
}

export const getRating = async (): Promise<RatingEntry[]> => {
  const response = await api({ credentials: 'include' }).get<{ data: RatingEntry[] }>(
    '/api/user/rating',
  )
  return response.data?.data ?? []
}
