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
  profile: {
    detail: (username: string) => ['profile', username] as const,
  },
  community: {
    all: () => ['community'] as const,
    detail: (slug: string) => ['community', slug] as const,
  },
  admin: {
    stats: () => ['admin', 'stats'] as const,
    aiCosts: () => ['admin', 'ai-costs'] as const,
    users: (params: object) => ['admin', 'users', params] as const,
    certificates: (params: object) => ['admin', 'certificates', params] as const,
    userCompletedLessons: (userId: string) => ['admin', 'users', userId, 'completed-lessons'] as const,
    userLesson: (userId: string, courseSlug: string, lessonSlug: string) =>
      ['admin', 'users', userId, 'lesson', courseSlug, lessonSlug] as const,
    lessonsTree: () => ['admin', 'lessons', 'tree'] as const,
    lessonSubmissions: (courseSlug: string, lessonSlug: string, page: number, search: string) =>
      ['admin', 'lessons', courseSlug, lessonSlug, 'submissions', page, search] as const,
  },
}
