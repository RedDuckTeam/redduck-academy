import { useQuery } from '@tanstack/react-query'
import type { LessonForUser } from '@/types/lesson'
import { getLessonForUser } from '@/lib/api/courses'

export const lessonForUserQueryKey = (courseSlug: string, lessonSlug: string) =>
  ['user', 'lesson', courseSlug, lessonSlug] as const

export const useLessonForUser = (courseSlug: string, lessonSlug: string) => {
  return useQuery({
    queryKey: lessonForUserQueryKey(courseSlug, lessonSlug),
    queryFn: async (): Promise<LessonForUser | null> => {
      const res = await getLessonForUser(courseSlug, lessonSlug)
      return res?.data ?? null
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}
