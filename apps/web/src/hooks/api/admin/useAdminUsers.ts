import { useQuery } from '@tanstack/react-query'
import { getAdminUsers } from '@/lib/api/admin'
import { queryKeys } from '@/lib/query-keys'

const PAGE_SIZE = 50

export const useAdminUsers = (page: number) => {
  return useQuery({
    queryKey: queryKeys.admin.users(page),
    queryFn: () => getAdminUsers({ page, pageSize: PAGE_SIZE }),
    staleTime: 30 * 1000,
  })
}

export const adminUsersPageSize = PAGE_SIZE
