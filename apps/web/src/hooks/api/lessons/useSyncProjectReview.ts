import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completedLessonsQueryKey } from '../user/useCompletedLessons'
import { lessonForUserQueryKey } from './useLessonForUser'
import { syncProjectReview } from '@/lib/api/courses'

export const useSyncProjectReview = (courseSlug: string, lessonSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await syncProjectReview(courseSlug, lessonSlug)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonForUserQueryKey(courseSlug, lessonSlug) })
      queryClient.invalidateQueries({ queryKey: completedLessonsQueryKey })
    },
  })
}
