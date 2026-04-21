import { useQuery } from '@tanstack/react-query'
import { getAdminStats } from '@/lib/api/admin'
import { queryKeys } from '@/lib/query-keys'

export const useAdminStats = () => {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: getAdminStats,
    staleTime: 60 * 1000,
  })
}
