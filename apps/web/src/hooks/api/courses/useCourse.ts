import { useQuery } from '@tanstack/react-query'
import { getCourse } from '@/lib/api/courses'

export const courseQueryKey = (slug: string) => ['courses', slug] as const

export const useCourse = (slug: string) => {
  return useQuery({
    queryKey: courseQueryKey(slug),
    queryFn: () => getCourse(slug),
    enabled: !!slug,
    staleTime: 1000 * 30 * 60, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}
