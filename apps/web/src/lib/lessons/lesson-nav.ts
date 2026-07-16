import type { Course } from '@/types/lesson'

// Shared reading-order navigation for a course. Both the lecture nav tiles and the project
// dialog's "Next" button need the lesson immediately before/after the current one, and each
// neighbor must carry its REAL module slug: the lesson route is module-scoped
// (/courses/<course>/<module>/<lesson>), so at a module boundary the next lesson lives in a
// different module and reusing the current module slug produces a URL that 404s.

export interface NavTarget {
  moduleSlug: string
  lessonSlug: string
  title: string
}

/** Flatten a course into a single reading-order list, each entry tagged with its module. */
export function flattenCourseLessons(course: Course | null | undefined): NavTarget[] {
  return (
    course?.modules?.flatMap((module) =>
      (module.lessons ?? []).map((lesson) => ({
        moduleSlug: module.slug,
        lessonSlug: lesson.slug,
        title: lesson.title,
      })),
    ) ?? []
  )
}

/**
 * The lessons immediately before and after the given one, each with its real module slug.
 * Matches on module + slug (not slug alone) so a slug repeated across modules can't select
 * the wrong entry.
 */
export function adjacentLessons(
  course: Course | null | undefined,
  moduleSlug: string,
  lessonSlug: string,
): { prev: NavTarget | null; next: NavTarget | null } {
  const flat = flattenCourseLessons(course)
  const index = flat.findIndex((entry) => entry.moduleSlug === moduleSlug && entry.lessonSlug === lessonSlug)
  if (index < 0) return { prev: null, next: null }
  return {
    prev: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
  }
}
