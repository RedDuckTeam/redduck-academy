import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { submitTest } from '@/lib/api/test'
import { queryKeys } from '@/lib/query-keys'
import { invalidateProgressQueries } from '@/lib/invalidate-progress'
import type { UserSettings } from '@/types/lesson'

const BAN_ERROR = "Couldn't submit lesson, please contact support"

export const useSubmitTest = (courseSlug: string, lessonSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Parameters<typeof submitTest>[0]) => {
      const settings = queryClient.getQueryData<UserSettings>(queryKeys.user.settings())
      if (settings?.blacklisted) throw new Error(BAN_ERROR)
      return submitTest(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.lesson(courseSlug, lessonSlug) })
      invalidateProgressQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit test')
    },
  })
}
