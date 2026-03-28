import type { Course } from '@/types/lesson'

export function resolveFocusedCourse(
  courses: Course[],
  courseSlug: string | undefined,
): Course | undefined {
  if (!courseSlug) return undefined
  return courses.find((c) => c.slug === courseSlug)
}
