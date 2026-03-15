import { useQuery } from '@tanstack/react-query'
import { getCoursesInfo } from '@/lib/api/courses'

const coursesInfoQueryKey = ['courses', 'info'] as const

export const useCoursesInfo = () => {
  return useQuery({
    queryKey: coursesInfoQueryKey,
    queryFn: getCoursesInfo,
    staleTime: 1000 * 30 * 60, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}
