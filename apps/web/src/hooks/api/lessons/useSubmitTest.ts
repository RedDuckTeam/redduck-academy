import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { submitTest } from '@/lib/api/test'
import { queryKeys } from '@/lib/query-keys'

export const useSubmitTest = (courseSlug: string, lessonSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.lesson(courseSlug, lessonSlug) })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.completedLessons() })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit test')
    },
  })
}
