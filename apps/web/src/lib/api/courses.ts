import { api } from './fetcher'
import type { Course, Lesson } from '@/types/lesson'

export interface GetCoursesResponse {
  data: Course[]
}

export const getCourses = async () => {
  const response = await api().get<GetCoursesResponse>('/api/courses')
  return response.data
}

export interface GetLessonResponse {
  data: Lesson
}

export const getLesson = async (courseSlug: string, lessonSlug: string) => {
  const response = await api().get<GetLessonResponse>(
    `/api/courses/${courseSlug}/lessons/${lessonSlug}`,
  )
  return response.data
}
