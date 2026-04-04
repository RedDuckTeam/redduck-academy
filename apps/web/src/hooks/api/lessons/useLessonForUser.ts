import { useQuery } from '@tanstack/react-query'
import type { LessonForUser } from '@/types/lesson'
import { LessonTypeEnum } from '@/types/lesson'
import { getLessonForUser } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'

export const useLessonForUser = (courseSlug: string, lessonSlug: string) => {
  return useQuery({
    queryKey: queryKeys.user.lesson(courseSlug, lessonSlug),
    queryFn: async (): Promise<LessonForUser | null> => {
      const res = await getLessonForUser(courseSlug, lessonSlug)
      return res?.data ?? null
    },
    staleTime: 60 * 1000,
    refetchInterval: (query) => {
      const d = query.state.data
      if (!d || d.type !== LessonTypeEnum.REVIEW_TASK) return false
      return d.submissions?.at(-1)?.status === 'pending' ? 60_000 : false
    },
  })
}
