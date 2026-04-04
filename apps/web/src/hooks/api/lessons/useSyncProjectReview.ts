import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { syncProjectReview } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'

export const useSyncProjectReview = (courseSlug: string, lessonSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => syncProjectReview(courseSlug, lessonSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.lesson(courseSlug, lessonSlug) })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.completedLessons() })
    },
    onError: () => {
      toast.error('Failed to check review status')
    },
  })
}
