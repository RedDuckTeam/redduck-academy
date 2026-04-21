import { useQuery } from '@tanstack/react-query'
import { getPublicProfile } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'

export const usePublicProfile = (username: string) => {
  return useQuery({
    queryKey: queryKeys.profile.detail(username),
    queryFn: () => getPublicProfile(username),
    staleTime: 60 * 1000,
    retry: false,
  })
}
