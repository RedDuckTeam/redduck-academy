export type CoursesPathnameSlugs = {
  courseSlug: string | null
  moduleSlug: string | null
  lessonSlug: string | null
}

/** Lesson path first (three segments after `/courses`), then hub (one segment). Otherwise all null. */
export function parseCoursesPathname(pathname: string): CoursesPathnameSlugs {
  const lesson = pathname.match(/^\/courses\/([^/]+)\/([^/]+)\/([^/]+)\/?$/)
  if (lesson) {
    return { courseSlug: lesson[1], moduleSlug: lesson[2], lessonSlug: lesson[3] }
  }
  const hub = pathname.match(/^\/courses\/([^/]+)\/?$/)
  if (hub) {
    return { courseSlug: hub[1], moduleSlug: null, lessonSlug: null }
  }
  return { courseSlug: null, moduleSlug: null, lessonSlug: null }
}
