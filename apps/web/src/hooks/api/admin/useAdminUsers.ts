import { useQuery } from '@tanstack/react-query'
import { getAdminUsers } from '@/lib/api/admin'

const PAGE_SIZE = 50

export type AdminUsersParams = {
  page: number
  sortBy?: 'email' | 'name' | 'lessonsPassed' | 'coursesPassed'
  sortDir?: 'asc' | 'desc'
  search?: string
}

export const useAdminUsers = (params: AdminUsersParams) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => getAdminUsers({ ...params, pageSize: PAGE_SIZE }),
    staleTime: 30 * 1000,
  })
}

export const adminUsersPageSize = PAGE_SIZE
