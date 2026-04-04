import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markLessonAsCompleted } from '@/lib/api/lessons'
import { queryKeys } from '@/lib/query-keys'

export const useMarkLessonCompleted = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) =>
      markLessonAsCompleted(courseSlug, lessonSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.completedLessons() })
    },
  })
}
