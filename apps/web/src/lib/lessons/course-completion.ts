import type { Course } from '@/types/lesson'

/** True when every lesson in the course is marked complete and the course has at least one lesson. */
export function isCourseFullyCompleted(course: Course, completedLessonIds: Set<number>): boolean {
  let lessonCount = 0
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      lessonCount += 1
      if (!completedLessonIds.has(lesson.id)) return false
    }
  }
  return lessonCount > 0
}
