import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { submitCodingTask } from '@/lib/api/coding-task'
import { queryKeys } from '@/lib/query-keys'
import { RateLimitError } from '@/lib/api/rate-limit'
import type { UserSettings } from '@/types/lesson'

const BAN_ERROR = "Couldn't submit lesson, please contact support"

export const useSubmitCodingTask = (courseSlug: string, lessonSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Parameters<typeof submitCodingTask>[0]) => {
      const settings = queryClient.getQueryData<UserSettings>(queryKeys.user.settings())
      if (settings?.blacklisted) throw new Error(BAN_ERROR)
      return submitCodingTask(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.lesson(courseSlug, lessonSlug) })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.completedLessons() })
    },
    onError: (error) => {
      if (error instanceof RateLimitError) {
        toast.error(error.message)
        return
      }
      toast.error(error instanceof Error ? error.message : 'Failed to submit code')
    },
  })
}
