import { createFileRoute } from '@tanstack/react-router'
import { HomePage, loadHomePageData } from '@/components/pages/home/home-page'
import { createPageMeta } from '@/lib/seo'

export const Route = createFileRoute('/')({
  ssr: true,
  loader: ({ context: { queryClient } }) => loadHomePageData(queryClient),
  head: () =>
    createPageMeta({
      title: 'Home',
      description:
        'Learn blockchain development with RedDuck Academy. Track your progress and browse interactive courses.',
      path: '/',
    }),
  component: () => <HomePage {...Route.useLoaderData()} />,
})
