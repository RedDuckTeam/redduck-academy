import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserSettings } from '@/lib/api/user'
import { ApiError } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query-keys'
import { usePrivyAuth } from '@/components/providers/privy-auth-context'
import { env } from '@/env'
import { useSessionHint } from './useSessionHint'

export const useSession = () => {
  const { ready, authenticated } = usePrivyAuth()
  const queryClient = useQueryClient()
  const cookieAuth = env.VITE_PRIVY_COOKIE_AUTH
  const hasSessionHint = useSessionHint()

  // Trust either signal: localStorage hint (synchronous, survives reload) or Privy's
  // authenticated state (async, but updates reactively after fresh login on the same tab —
  // localStorage 'storage' events don't fire for same-tab writes, so the hint can lag).
  const sessionAvailable = hasSessionHint || authenticated

  // With cookie auth the backend session can outlive Privy's localStorage tokens,
  // so probe /api/user/settings unconditionally and let the cookie be the source of truth.
  const enabled = cookieAuth ? true : sessionAvailable && authenticated

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.user.settings(),
    queryFn: getUserSettings,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => failureCount < 3 && error instanceof ApiError && error.status === 401,
    retryDelay: 300,
  })

  const session = settings ? { user: settings } : null

  const refetch = () => queryClient.invalidateQueries({ queryKey: queryKeys.user.settings() })

  const isPending = cookieAuth
    ? isLoading && !settings
    : sessionAvailable
      ? !ready || (authenticated && isLoading)
      : authenticated && isLoading

  return {
    session,
    isPending,
    refetch,
  }
}
