import { useMemo } from 'react'
import type { Course } from '@/types/lesson'
import type { CompletedLesson } from '@/lib/api/user'
import { useCourses } from '@/hooks/api/courses/useCourses'
import { useCompletedLessons } from './useCompletedLessons'
import { useUserSettings } from './useUserSettings'

export type UserCourseAccessState = {
  lockedSlugs: Set<string>
  prerequisiteTitleByCourseSlug: Map<string, string>
  prerequisiteSlugByCourseSlug: Map<string, string>
}

export const emptyUserCourseAccess: UserCourseAccessState = {
  lockedSlugs: new Set(),
  prerequisiteTitleByCourseSlug: new Map(),
  prerequisiteSlugByCourseSlug: new Map(),
}

export function computeCourseAccess(
  courses: Course[],
  completedLessons: CompletedLesson[],
  skipPrerequisites: boolean,
): UserCourseAccessState {
  if (skipPrerequisites) return emptyUserCourseAccess

  const completedLessonIds = new Set(completedLessons.map((l) => l.lessonId))

  const lessonIdsByCourseSlug = new Map<string, Set<number>>()
  for (const course of courses) {
    lessonIdsByCourseSlug.set(
      course.slug,
      new Set(course.modules.flatMap((m) => m.lessons.map((l) => l.id))),
    )
  }

  const lockedSlugs = new Set<string>()
  const prerequisiteTitleByCourseSlug = new Map<string, string>()
  const prerequisiteSlugByCourseSlug = new Map<string, string>()

  for (const course of courses) {
    const prereq = course.prerequisiteCourse
    if (!prereq?.slug) continue

    const prereqLessons = lessonIdsByCourseSlug.get(prereq.slug)
    if (!prereqLessons || prereqLessons.size === 0) continue

    const allCompleted = [...prereqLessons].every((id) => completedLessonIds.has(id))
    if (!allCompleted) {
      lockedSlugs.add(course.slug)
      if (prereq.title) prerequisiteTitleByCourseSlug.set(course.slug, prereq.title)
      prerequisiteSlugByCourseSlug.set(course.slug, prereq.slug)
    }
  }

  return { lockedSlugs, prerequisiteTitleByCourseSlug, prerequisiteSlugByCourseSlug }
}

export const useCourseAccess = (): UserCourseAccessState => {
  const { data: coursesData } = useCourses()
  const courses = coursesData?.data ?? []
  const { data: completedLessons = [] } = useCompletedLessons()
  const { data: settings } = useUserSettings()

  return useMemo(
    () => computeCourseAccess(courses, completedLessons, settings?.skipPrerequisites ?? false),
    [courses, completedLessons, settings?.skipPrerequisites],
  )
}
