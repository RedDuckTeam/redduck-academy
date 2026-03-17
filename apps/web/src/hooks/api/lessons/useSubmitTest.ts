import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completedLessonsQueryKey } from '../user/useCompletedLessons'
import { lessonForUserQueryKey } from './useLessonForUser'
import { submitTest } from '@/lib/api/test'

export const useSubmitTest = (courseSlug: string, lessonSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonForUserQueryKey(courseSlug, lessonSlug) })
      queryClient.invalidateQueries({ queryKey: completedLessonsQueryKey })
    },
  })
}
