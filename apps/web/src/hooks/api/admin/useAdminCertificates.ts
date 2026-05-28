import { useQuery } from '@tanstack/react-query'
import { getAdminCertificates } from '@/lib/api/admin'
import { queryKeys } from '@/lib/query-keys'

const PAGE_SIZE = 50

export type AdminCertificatesParams = {
  page: number
  sortBy?: 'issuedAt' | 'userEmail' | 'courseSlug' | 'status' | 'name'
  sortDir?: 'asc' | 'desc'
  status?: 'all' | 'created' | 'requested' | 'claimed'
  search?: string
}

export const useAdminCertificates = (params: AdminCertificatesParams) => {
  return useQuery({
    queryKey: queryKeys.admin.certificates(params),
    queryFn: () => getAdminCertificates({ ...params, pageSize: PAGE_SIZE }),
    staleTime: 30 * 1000,
  })
}

export const adminCertificatesPageSize = PAGE_SIZE
