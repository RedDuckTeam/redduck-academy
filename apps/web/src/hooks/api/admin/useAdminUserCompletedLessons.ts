import { useQuery } from '@tanstack/react-query'
import { getAdminUserCompletedLessons } from '@/lib/api/admin'
import { queryKeys } from '@/lib/query-keys'

export const useAdminUserCompletedLessons = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.admin.userCompletedLessons(userId),
    queryFn: () => getAdminUserCompletedLessons(userId),
    staleTime: 30 * 1000,
    enabled: !!userId,
  })
}
