import { useMemo } from 'react'
import type { CompletedLesson } from '@/lib/api/user'
import type { Course, CourseStatus } from '@/types/lesson'
import { CourseStatusEnum } from '@/types/lesson'

export interface CourseProgressItem {
  nextLesson: { moduleSlug: string; lessonSlug: string } | null
  status: CourseStatus
}

export function useCourseProgress(courses: Course[], completedLessons: CompletedLesson[]): CourseProgressItem[] {
  const completedLessonIds = useMemo(
    () => new Set(completedLessons.map((c) => c.lessonId)),
    [completedLessons],
  )

  return useMemo(() => {
    return courses.map((course) => {
      const orderedLessons = [...course.modules]
        .sort((a, b) => a.order - b.order)
        .flatMap((module) =>
          [...module.lessons]
            .sort((a, b) => a.order - b.order)
            .map((lesson) => ({ lessonId: lesson.id, lessonSlug: lesson.slug, moduleSlug: module.slug })),
        )

      const nextLessonData = orderedLessons.find((item) => !completedLessonIds.has(item.lessonId))
      const nextLesson = nextLessonData
        ? { moduleSlug: nextLessonData.moduleSlug, lessonSlug: nextLessonData.lessonSlug }
        : null

      const hasAnyCompleted = orderedLessons.some((item) => completedLessonIds.has(item.lessonId))
      let status: CourseStatus
      if (!nextLessonData) {
        status = CourseStatusEnum.COMPLETED
      } else if (!hasAnyCompleted) {
        status = CourseStatusEnum.START
      } else {
        status = CourseStatusEnum.CONTINUE
      }

      return { nextLesson, status }
    })
  }, [courses, completedLessonIds])
}
