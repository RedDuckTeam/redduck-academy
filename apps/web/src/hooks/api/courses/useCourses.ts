import { queryOptions, useQuery } from '@tanstack/react-query'
import { getCourses } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'

export const coursesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.courses.all(),
    queryFn: getCourses,
    // Course structure is immutable per deploy — cache for the whole session so it is
    // fetched once, not on every navigation.
    staleTime: Infinity,
    gcTime: Infinity,
  })

export const useCourses = () => useQuery(coursesQueryOptions())
