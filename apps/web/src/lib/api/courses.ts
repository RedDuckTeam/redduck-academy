import { api } from './fetcher'
import type { Course, Lesson, LessonForUser } from '@/types/lesson'

export interface GetCoursesResponse {
  data: Course[]
}

export interface CourseInfo {
  id: number
  title: string
  totalPoints: number
  totalTasks: number
}

export interface GetCoursesInfoResponse {
  data: CourseInfo[]
}

export const getCoursesInfo = async () => {
  const response = await api().get<GetCoursesInfoResponse>('/api/courses/info')
  return response.data
}

export const getCourses = async () => {
  const response = await api().get<GetCoursesResponse>('/api/courses')
  return response.data
}

export const getCourse = async (slug: string) => {
  const response = await api().get<{ data: Course }>(`/api/courses/${slug}`)
  return response.data
}

export interface GetLessonResponse {
  data: Lesson
}

export const getLesson = async (courseSlug: string, lessonSlug: string) => {
  const response = await api().get<GetLessonResponse>(`/api/lessons/${courseSlug}/${lessonSlug}`)
  return response.data
}

export interface GetLessonForUserResponse {
  data: LessonForUser
}

export const getLessonForUser = async (
  courseSlug: string,
  lessonSlug: string,
): Promise<GetLessonForUserResponse | null> => {
  const response = await api({ credentials: 'include' }).get<GetLessonForUserResponse>(
    `/api/user/lessons/${courseSlug}/${lessonSlug}`,
  )
  return response.data
}

export const syncProjectReview = async (courseSlug: string, lessonSlug: string) => {
  await api({ credentials: 'include' }).post(`/api/user/lessons/${courseSlug}/${lessonSlug}/sync-project-review`)
}
