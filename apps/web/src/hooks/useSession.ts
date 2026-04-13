import { getAuthClient } from '@/lib/auth-client'

export const useSession = () => {
  const { data: session, isPending } = getAuthClient().useSession()
  return { session, isPending }
}
