import { useQuery } from '@tanstack/react-query'
import { getCompletedLessons } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'
import { useSession } from '@/hooks/useSession'

export const useCompletedLessons = () => {
  const { session } = useSession()

  return useQuery({
    queryKey: queryKeys.user.completedLessons(),
    queryFn: getCompletedLessons,
    staleTime: 60 * 1000,
    enabled: !!session?.user,
    retry: false,
  })
}
