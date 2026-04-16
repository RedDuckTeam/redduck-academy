import { getAuthClient } from '@/lib/auth-client'

export const useSession = () => {
  const { data: session, isPending, refetch } = getAuthClient().useSession()
  return { session, isPending, refetch }
}
