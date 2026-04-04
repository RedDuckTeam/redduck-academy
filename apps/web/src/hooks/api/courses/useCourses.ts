import { useQuery } from '@tanstack/react-query'
import { getCourses } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'

export const useCourses = () => {
  return useQuery({
    queryKey: queryKeys.courses.all(),
    queryFn: getCourses,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
