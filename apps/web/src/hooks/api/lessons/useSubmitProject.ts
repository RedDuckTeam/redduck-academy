import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { submitProject } from '@/lib/api/project'
import { queryKeys } from '@/lib/query-keys'
import { invalidateProgressQueries } from '@/lib/invalidate-progress'
import type { UserSettings } from '@/types/lesson'

const BAN_ERROR = "Couldn't submit lesson, please contact support"

export const useSubmitProject = (courseSlug: string, lessonSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Parameters<typeof submitProject>[0]) => {
      const settings = queryClient.getQueryData<UserSettings>(queryKeys.user.settings())
      if (settings?.blacklisted) throw new Error(BAN_ERROR)
      return submitProject(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.lesson(courseSlug, lessonSlug) })
      invalidateProgressQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit project')
    },
  })
}
