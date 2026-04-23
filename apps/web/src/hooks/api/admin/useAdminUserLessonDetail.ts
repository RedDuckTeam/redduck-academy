import { useQuery } from '@tanstack/react-query'
import { getAdminUserLessonDetail } from '@/lib/api/admin'
import { queryKeys } from '@/lib/query-keys'

export const useAdminUserLessonDetail = (userId: string, courseSlug: string, lessonSlug: string) => {
  return useQuery({
    queryKey: queryKeys.admin.userLesson(userId, courseSlug, lessonSlug),
    queryFn: () => getAdminUserLessonDetail(userId, courseSlug, lessonSlug),
    staleTime: 30 * 1000,
    enabled: !!userId && !!courseSlug && !!lessonSlug,
  })
}
