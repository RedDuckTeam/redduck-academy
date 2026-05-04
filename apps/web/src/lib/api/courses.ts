import { api } from './fetcher'
import { ApiError } from './errors'
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
  return api().get<GetCoursesInfoResponse>('/api/courses/info')
}

export const getCourses = async () => {
  return api().get<GetCoursesResponse>('/api/courses')
}

export const getCourse = async (slug: string) => {
  return api().get<{ data: Course }>(`/api/courses/${slug}`)
}

export interface GetLessonResponse {
  data: Lesson
}

export const getLesson = async (courseSlug: string, lessonSlug: string) => {
  return api().get<GetLessonResponse>(`/api/lessons/${courseSlug}/${lessonSlug}`)
}

export interface GetLessonForUserResponse {
  data: LessonForUser
}

export const getLessonForUser = async (
  courseSlug: string,
  lessonSlug: string,
): Promise<GetLessonForUserResponse | null> => {
  try {
    return await api().get<GetLessonForUserResponse>(
      `/api/user/lessons/${courseSlug}/${lessonSlug}`,
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      const slug = err.extra?.prerequisiteCourseSlug as string | undefined
      const title = err.extra?.prerequisiteCourseTitle as string | undefined
      if (slug && title) throw new CourseLockedError(slug, title)
    }
    throw err
  }
}

export const syncProjectReview = async (courseSlug: string, lessonSlug: string) => {
  await api().post(`/api/user/lessons/${courseSlug}/${lessonSlug}/sync-project-review`)
}
