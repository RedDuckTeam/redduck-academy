import { useQuery } from '@tanstack/react-query'
import { getCourse } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'

export const useCourse = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.courses.detail(slug),
    queryFn: () => getCourse(slug),
    enabled: !!slug,
    // Immutable per deploy — cache for the session (fetched once, not per navigation).
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
