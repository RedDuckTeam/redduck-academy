import { createFileRoute } from '@tanstack/react-router'
import { RatingPage } from '@/components/pages/rating/rating-page'
import { createPageMeta } from '@/lib/seo'

export const Route = createFileRoute('/ranking')({
  ssr: true,
  head: () =>
    createPageMeta({
      title: 'Ranking',
      description: 'See how you rank among other students on RedDuck Academy.',
      path: '/ranking',
    }),
  component: RatingPage,
})
