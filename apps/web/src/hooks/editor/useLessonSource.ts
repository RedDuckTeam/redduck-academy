import { useQuery } from '@tanstack/react-query'
import { loadLessonSource } from '@/lib/editor/lesson-source'
import { queryKeys } from '@/lib/query-keys'

export const useLessonSource = (courseSlug: string, moduleSlug: string, lessonSlug: string) =>
  useQuery({
    queryKey: queryKeys.editor.lessonSource(courseSlug, moduleSlug, lessonSlug),
    queryFn: () => loadLessonSource(courseSlug, moduleSlug, lessonSlug),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })
