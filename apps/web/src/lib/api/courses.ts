import { api } from './fetcher'
import { ApiError } from './errors'
import type { Course, Lesson, LessonForUser } from '@/types/lesson'
import { LessonTypeEnum } from '@/types/lesson'
import { loadCoursesManifest, loadCourseManifest, findLessonInCourse } from '@/lib/content/manifest'

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

// Course/lesson STRUCTURE is served from the open-source `content/` files (the manifests
// emitted by the `content-assets` Vite plugin), so the program and every lecture render
// with no backend. The backend is consulted only for a lesson's assessment data (test
// questions, coding-task config, review rubric) and, separately, for per-user progress.
export const getCourses = async (): Promise<GetCoursesResponse> => {
  const courses = await loadCoursesManifest()
  return { data: courses ?? [] }
}

export const getCourse = async (slug: string): Promise<{ data: Course }> => {
  const course = await loadCourseManifest(slug)
  if (!course) throw new ApiError(`Course not found: ${slug}`, 404)
  return { data: course }
}

export interface GetLessonResponse {
  data: Lesson
}

export const getLesson = async (courseSlug: string, lessonSlug: string): Promise<GetLessonResponse> => {
  const course = await loadCourseManifest(courseSlug)
  const fileLesson = findLessonInCourse(course, lessonSlug)

  // Not in the files (e.g. a lesson that exists only in the CMS) — defer to the backend.
  if (!fileLesson) {
    return api().get<GetLessonResponse>(`/api/lessons/${courseSlug}/${lessonSlug}`)
  }

  // A lecture renders entirely from files. Other types need their assessment data from the
  // backend; merge it in when reachable, keeping the file's structure authoritative. When
  // the backend is unavailable, the lesson still renders its prose.
  if (fileLesson.type === LessonTypeEnum.LECTURE) return { data: fileLesson }
  try {
    const res = await api().get<GetLessonResponse>(`/api/lessons/${courseSlug}/${lessonSlug}`)
    return { data: { ...res.data, ...fileLesson } }
  } catch {
    return { data: fileLesson }
  }
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
