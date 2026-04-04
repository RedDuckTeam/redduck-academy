import { useQuery } from '@tanstack/react-query'
import { getCoursesInfo } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'

export const useCoursesInfo = () => {
  return useQuery({
    queryKey: queryKeys.courses.info(),
    queryFn: getCoursesInfo,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
