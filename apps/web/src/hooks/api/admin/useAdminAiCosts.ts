import { useQuery } from '@tanstack/react-query'
import { getAdminAiCosts } from '@/lib/api/admin'
import { queryKeys } from '@/lib/query-keys'

export const useAdminAiCosts = () => {
  return useQuery({
    queryKey: queryKeys.admin.aiCosts(),
    queryFn: getAdminAiCosts,
    staleTime: 60 * 1000,
  })
}
