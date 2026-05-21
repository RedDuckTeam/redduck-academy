import { useQuery } from '@tanstack/react-query'
import { getAdminLessonSubmissions } from '@/lib/api/admin'
import { queryKeys } from '@/lib/query-keys'

export const useAdminLessonSubmissions = (input: {
  courseSlug: string
  lessonSlug: string
  page: number
  search: string
}) => {
  return useQuery({
    queryKey: queryKeys.admin.lessonSubmissions(input.courseSlug, input.lessonSlug, input.page, input.search),
    queryFn: () =>
      getAdminLessonSubmissions({
        courseSlug: input.courseSlug,
        lessonSlug: input.lessonSlug,
        page: input.page,
        search: input.search || undefined,
      }),
    staleTime: 30 * 1000,
  })
}
