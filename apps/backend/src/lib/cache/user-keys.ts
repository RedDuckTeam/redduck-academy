import { cache } from '.'

export const userCacheKeys = {
  stats: (userId: string) =>
    `user:${userId}:stats`,

  completedLessons: (userId: string) =>
    `user:${userId}:completed-lessons`,

  lessonProgress: (userId: string, courseSlug: string, lessonSlug: string) =>
    `user:${userId}:lesson:${courseSlug}:${lessonSlug}`,
}

/**
 * Invalidates all cached data for a user.
 * Call this after any action that mutates user state:
 *   - completing a lecture
 *   - submitting / syncing a test or project review
 *
 * Pass courseSlug + lessonSlug to also bust the specific lesson-progress entry.
 */
export async function invalidateUserCache(
  userId: string,
  lesson?: { courseSlug: string; lessonSlug: string },
): Promise<void> {
  await Promise.all([
    cache.delete(userCacheKeys.stats(userId)),
    cache.delete(userCacheKeys.completedLessons(userId)),
    ...(lesson
      ? [cache.delete(userCacheKeys.lessonProgress(userId, lesson.courseSlug, lesson.lessonSlug))]
      : []),
  ])
}
