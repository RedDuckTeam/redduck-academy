import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserSettings } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'
import { usePrivyAuth } from '@/components/providers/privy-auth-context'

export const useSession = () => {
  const { ready, authenticated } = usePrivyAuth()
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.user.settings(),
    queryFn: getUserSettings,
    enabled: ready && authenticated,
    staleTime: 5 * 60 * 1000,
  })

  const session = settings ? { user: settings } : null
  const refetch = () => queryClient.invalidateQueries({ queryKey: queryKeys.user.settings() })
  const isPending = !ready || (authenticated && isLoading)

  return { session, isPending, refetch }
}
