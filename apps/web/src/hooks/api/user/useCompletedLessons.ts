import { useQuery } from '@tanstack/react-query'
import { getCompletedLessons } from '@/lib/api/user'

export const completedLessonsQueryKey = ['user', 'completed-lessons'] as const

export const useCompletedLessons = () => {
  return useQuery({
    queryKey: completedLessonsQueryKey,
    queryFn: getCompletedLessons,
    staleTime: 1000 * 60, // 1 minute
  })
}
