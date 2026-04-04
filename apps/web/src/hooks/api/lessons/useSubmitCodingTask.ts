import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { submitCodingTask } from '@/lib/api/coding-task'
import { queryKeys } from '@/lib/query-keys'

export const useSubmitCodingTask = (courseSlug: string, lessonSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitCodingTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.lesson(courseSlug, lessonSlug) })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.completedLessons() })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit code')
    },
  })
}
