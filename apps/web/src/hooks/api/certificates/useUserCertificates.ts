import { useQuery } from '@tanstack/react-query'
import { getUserCertificates } from '@/lib/api/certificates'
import { queryKeys } from '@/lib/query-keys'
import { useSession } from '@/hooks/useSession'

export const useUserCertificates = (options?: { enabled?: boolean }) => {
  const { session } = useSession()

  return useQuery({
    queryKey: queryKeys.certificates.all(),
    queryFn: getUserCertificates,
    staleTime: 60 * 1000,
    enabled: (options?.enabled ?? true) && !!session?.user,
  })
}
