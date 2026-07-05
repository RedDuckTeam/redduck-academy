import { createFileRoute } from '@tanstack/react-router'
import { HomePage, loadHomePageData } from '@/components/pages/home/home-page'
import { createPageMeta } from '@/lib/seo'

// Same page as `/`; the canonical (via path) points search engines at the root
// so the two URLs never compete in the index.
export const Route = createFileRoute('/dashboard')({
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
