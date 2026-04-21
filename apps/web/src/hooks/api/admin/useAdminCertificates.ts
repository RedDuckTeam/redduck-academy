import { useQuery } from '@tanstack/react-query'
import { getAdminCertificates } from '@/lib/api/admin'
import { queryKeys } from '@/lib/query-keys'

const PAGE_SIZE = 50

export const useAdminCertificates = (page: number) => {
  return useQuery({
    queryKey: queryKeys.admin.certificates(page),
    queryFn: () => getAdminCertificates({ page, pageSize: PAGE_SIZE }),
    staleTime: 30 * 1000,
  })
}

export const adminCertificatesPageSize = PAGE_SIZE
