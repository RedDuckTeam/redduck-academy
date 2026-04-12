import { api } from './fetcher'

export interface ProgressCards {
  points: number
  completedLessonsCount: number
  completedCoursesCount: number
  totalCoursesCount: number
  currentStreak: number
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
  pointsEarned: number
  maxPoints: number
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
