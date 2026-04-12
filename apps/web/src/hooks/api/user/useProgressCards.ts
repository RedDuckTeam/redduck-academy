import { useQuery } from '@tanstack/react-query'
import { getProgressCards } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'

export const useProgressCards = () => {
  return useQuery({
    queryKey: queryKeys.user.progressCards(),
    queryFn: getProgressCards,
    staleTime: 60 * 1000,
  })
}
