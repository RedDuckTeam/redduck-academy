import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markLessonAsCompleted } from '@/lib/api/lessons'
import { queryKeys } from '@/lib/query-keys'
import type { UserSettings } from '@/types/lesson'

export const useMarkLessonCompleted = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { courseSlug: string; lessonSlug: string }>({
    mutationFn: async ({ courseSlug, lessonSlug }) => {
      const settings = queryClient.getQueryData<UserSettings>(queryKeys.user.settings())
      if (settings?.blacklisted) return
      await markLessonAsCompleted(courseSlug, lessonSlug)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.completedLessons(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.progressCards(), refetchType: 'all' })
    },
  })
}
