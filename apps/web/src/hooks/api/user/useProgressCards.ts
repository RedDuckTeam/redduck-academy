import { useQuery } from '@tanstack/react-query'
import { getProgressCards } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'
import { useSession } from '@/hooks/useSession'

export const useProgressCards = () => {
  const { session } = useSession()

  return useQuery({
    queryKey: queryKeys.user.progressCards(),
    queryFn: getProgressCards,
    staleTime: 60 * 1000,
    enabled: !!session?.user,
    retry: false,
    // Overrides the global `refetchOnMount: false` so the dashboard cards pick up
    // invalidations queued while the user was off-route (e.g. completing a lecture).
    refetchOnMount: true,
  })
}
