import { useQuery } from '@tanstack/react-query'
import { getCourses } from '@/lib/api/courses'

const coursesQueryKey = ['courses'] as const

export const useCourses = () => {
  return useQuery({
    queryKey: coursesQueryKey,
    queryFn: getCourses,
    staleTime: 1000 * 30 * 60, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}
