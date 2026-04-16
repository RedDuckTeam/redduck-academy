export const queryKeys = {
  courses: {
    all: () => ['courses'] as const,
    info: () => ['courses', 'info'] as const,
    detail: (slug: string) => ['courses', slug] as const,
  },
  lessons: {
    detail: (courseSlug: string, lessonSlug: string) =>
      ['lessons', courseSlug, lessonSlug] as const,
  },
  user: {
    completedLessons: () => ['user', 'completed-lessons'] as const,
    progressCards: () => ['user', 'progress-cards'] as const,
    lesson: (courseSlug: string, lessonSlug: string) =>
      ['user', 'lesson', courseSlug, lessonSlug] as const,
    settings: () => ['user', 'settings'] as const,
    rating: () => ['user', 'rating'] as const,
  },
  certificates: {
    all: () => ['certificates'] as const,
  },
  community: {
    all: () => ['community'] as const,
    detail: (slug: string) => ['community', slug] as const,
  },
}
