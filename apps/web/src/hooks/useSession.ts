import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserSettings } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'
import { usePrivyAuth } from '@/components/providers/privy-auth-context'
import { env } from '@/env'
import { useSessionHint } from './useSessionHint'

export const useSession = () => {
  const { ready, authenticated } = usePrivyAuth()
  const queryClient = useQueryClient()
  const cookieAuth = env.VITE_PRIVY_COOKIE_AUTH
  const hasSessionHint = useSessionHint()

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.user.settings(),
    queryFn: getUserSettings,
    enabled: hasSessionHint && (cookieAuth || authenticated),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const session = settings ? { user: settings } : null

  const refetch = () => queryClient.invalidateQueries({ queryKey: queryKeys.user.settings() })

  const isPending = cookieAuth
    ? isLoading && !settings && hasSessionHint
    : hasSessionHint
      ? !ready || (authenticated && isLoading)
      : authenticated && isLoading

  return {
    session,
    isPending,
    refetch,
  }
}
