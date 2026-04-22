import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserSettings } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'
import { usePrivyAuth } from '@/components/providers/privy-auth-context'
import { env } from '@/env'

export const useSession = () => {
  const { ready, authenticated } = usePrivyAuth()
  const queryClient = useQueryClient()
  const cookieAuth = env.VITE_PRIVY_COOKIE_AUTH

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.user.settings(),
    queryFn: getUserSettings,
    enabled: cookieAuth || authenticated,
    staleTime: 5 * 60 * 1000,
  })

  const session = settings ? { user: settings } : null

  const refetch = () => queryClient.invalidateQueries({ queryKey: queryKeys.user.settings() })

  return {
    session,
    isPending: cookieAuth ? isLoading && !settings : !ready || (authenticated && isLoading),
    refetch,
  }
}
