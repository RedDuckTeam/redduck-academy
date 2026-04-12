import { useQuery } from '@tanstack/react-query'
import { getUserCertificates } from '@/lib/api/certificates'
import { queryKeys } from '@/lib/query-keys'

export const useUserCertificates = () => {
  return useQuery({
    queryKey: queryKeys.certificates.all(),
    queryFn: getUserCertificates,
    staleTime: 60 * 1000,
  })
}
