import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'

/**
 * Invalidate every query that reflects a user's learning progress after they
 * complete a lesson: their completed-lessons list, the dashboard progress cards
 * (lessons/courses completed, streak, rank), and the public ranking table.
 *
 * Call from the `onSuccess` of any completion mutation. Active queries refetch
 * immediately; inactive ones (e.g. the ranking table, viewed on another page)
 * refetch the next time they mount — which fixes them going stale after a user
 * completes lessons elsewhere.
 */
export function invalidateProgressQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.user.completedLessons() })
  queryClient.invalidateQueries({ queryKey: queryKeys.user.progressCards() })
  queryClient.invalidateQueries({ queryKey: queryKeys.user.rating() })
}
