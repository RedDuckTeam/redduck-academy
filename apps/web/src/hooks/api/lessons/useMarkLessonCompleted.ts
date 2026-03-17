import { useMutation } from '@tanstack/react-query'
import { markLessonAsCompleted } from '@/lib/api/lessons'

export const useMarkLessonCompleted = () => {
  return useMutation({
    mutationFn: ({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) =>
      markLessonAsCompleted(courseSlug, lessonSlug),
  })
}
