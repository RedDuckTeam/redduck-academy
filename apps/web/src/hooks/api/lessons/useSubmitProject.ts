import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completedLessonsQueryKey } from '../user/useCompletedLessons'
import { lessonForUserQueryKey } from './useLessonForUser'
import { submitProject } from '@/lib/api/project'

export const useSubmitProject = (courseSlug: string, lessonSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonForUserQueryKey(courseSlug, lessonSlug) })
      queryClient.invalidateQueries({ queryKey: completedLessonsQueryKey })
    },
  })
}
