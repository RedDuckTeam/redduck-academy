import { useQuery } from '@tanstack/react-query'
import type { LessonForUser } from '@/types/lesson'
import { LessonTypeEnum } from '@/types/lesson'
import { CourseLockedError, getLessonForUser } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'
import { useSession } from '@/hooks/useSession'

export { CourseLockedError }

export const useLessonForUser = (courseSlug: string, lessonSlug: string) => {
  const { session } = useSession()
  return useQuery({
    queryKey: queryKeys.user.lesson(courseSlug, lessonSlug),
    queryFn: async (): Promise<LessonForUser | null> => {
      const res = await getLessonForUser(courseSlug, lessonSlug)
      return res?.data ?? null
    },
    enabled: !!session,
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof CourseLockedError) return false
      return failureCount < 3
    },
    refetchInterval: (query) => {
      const d = query.state.data
      if (!d || d.type !== LessonTypeEnum.REVIEW_TASK) return false
      const latest = d.submissions?.at(-1)
      return latest && 'status' in latest && latest.status === 'pending' ? 60_000 : false
    },
  })
}
