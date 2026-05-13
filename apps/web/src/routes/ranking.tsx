import { createFileRoute } from '@tanstack/react-router'
import { RatingPage } from '@/components/pages/rating/rating-page'
import { createPageMeta } from '@/lib/seo'
import { getRating } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'

export const Route = createFileRoute('/ranking')({
  ssr: true,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: queryKeys.user.rating(),
      queryFn: getRating,
      staleTime: 60 * 1000,
    })
  },
  head: () =>
    createPageMeta({
      title: 'Ranking',
      description: 'See how you rank among other students on RedDuck Academy.',
      path: '/ranking',
    }),
  component: RatingPage,
})
