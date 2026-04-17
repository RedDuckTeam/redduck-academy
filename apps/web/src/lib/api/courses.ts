import { api } from './fetcher'
import type { Course, Lesson, LessonForUser } from '@/types/lesson'

export interface GetCoursesResponse {
  data: Course[]
}

export interface CourseInfo {
  id: number
  title: string
  totalTasks: number
}

export class CourseLockedError extends Error {
  prerequisiteCourseSlug: string
  prerequisiteCourseTitle: string
  constructor(prerequisiteCourseSlug: string, prerequisiteCourseTitle: string) {
    super(`Course locked: complete "${prerequisiteCourseTitle}" first`)
    this.name = 'CourseLockedError'
    this.prerequisiteCourseSlug = prerequisiteCourseSlug
    this.prerequisiteCourseTitle = prerequisiteCourseTitle
  }
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
  if (response.status === 403) {
    const slug = response.errorData?.prerequisiteCourseSlug as string | undefined
    const title = response.errorData?.prerequisiteCourseTitle as string | undefined
    if (slug && title) throw new CourseLockedError(slug, title)
  }
  return response.data
}

export const syncProjectReview = async (courseSlug: string, lessonSlug: string) => {
  await api({ credentials: 'include' }).post(`/api/user/lessons/${courseSlug}/${lessonSlug}/sync-project-review`)
}
