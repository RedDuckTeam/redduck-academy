import { useQuery } from '@tanstack/react-query'
import { getCourse } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'

export const useCourse = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.courses.detail(slug),
    queryFn: () => getCourse(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
