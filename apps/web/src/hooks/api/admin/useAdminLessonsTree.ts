import { useQuery } from '@tanstack/react-query'
import { getAdminLessonsTree } from '@/lib/api/admin'
import { queryKeys } from '@/lib/query-keys'

export const useAdminLessonsTree = () => {
  return useQuery({
    queryKey: queryKeys.admin.lessonsTree(),
    queryFn: getAdminLessonsTree,
    staleTime: 60 * 1000,
  })
}
