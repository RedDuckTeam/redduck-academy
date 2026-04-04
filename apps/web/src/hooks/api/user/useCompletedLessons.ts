import { useQuery } from '@tanstack/react-query'
import { getCompletedLessons } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'

export const useCompletedLessons = () => {
  return useQuery({
    queryKey: queryKeys.user.completedLessons(),
    queryFn: getCompletedLessons,
    staleTime: 60 * 1000,
  })
}
