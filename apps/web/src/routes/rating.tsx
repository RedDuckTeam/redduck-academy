import { createFileRoute } from '@tanstack/react-router'
import { RatingPage } from '@/components/pages/rating/rating-page'
import { createPageMeta } from '@/lib/seo'

export const Route = createFileRoute('/rating')({
  ssr: true,
  head: () =>
    createPageMeta({
      title: 'Rating',
      description: 'See how you rank among other students on RedDuck Academy.',
      path: '/rating',
    }),
  component: RatingPage,
})
