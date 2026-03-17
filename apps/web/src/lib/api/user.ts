import { api } from './fetcher'

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
