import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { markLessonAsCompleted } from '@/lib/api/lessons'
import { queryKeys } from '@/lib/query-keys'
import type { UserSettings } from '@/types/lesson'
import type { CompletedLesson } from '@/lib/api/user'

interface MarkLessonCompletedVars {
  courseSlug: string
  lessonSlug: string
  lessonTitle?: string
}

interface MarkLessonCompletedResult {
  wasAlreadyCompleted: boolean
}

export const useMarkLessonCompleted = () => {
  const queryClient = useQueryClient()

  return useMutation<MarkLessonCompletedResult, Error, MarkLessonCompletedVars>({
    mutationFn: async ({ courseSlug, lessonSlug }) => {
      const settings = queryClient.getQueryData<UserSettings>(queryKeys.user.settings())
      if (settings?.blacklisted) return { wasAlreadyCompleted: true }

      const cached = queryClient.getQueryData<CompletedLesson[]>(queryKeys.user.completedLessons())
      const wasAlreadyCompleted = cached?.some((l) => l.courseSlug === courseSlug && l.lessonSlug === lessonSlug) ?? false

      await markLessonAsCompleted(courseSlug, lessonSlug)
      return { wasAlreadyCompleted }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.completedLessons(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.progressCards(), refetchType: 'all' })

      if (!result.wasAlreadyCompleted && variables.lessonTitle) {
        toast.success('Lesson completed', { description: `Lesson ${variables.lessonTitle} completed` })
      }
    },
  })
}
