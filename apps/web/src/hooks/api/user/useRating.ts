import { useQuery } from '@tanstack/react-query'
import { getRating } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'

export const useRating = () => {
  return useQuery({
    queryKey: queryKeys.user.rating(),
    queryFn: getRating,
    staleTime: 60 * 1000,
  })
}
