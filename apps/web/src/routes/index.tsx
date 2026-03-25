import { createFileRoute } from '@tanstack/react-router'
import { Progress } from '@/components/pages/home/progress/progress'
import { createPageMeta } from '@/lib/seo'
import { MyProgress } from '@/components/pages/home/my-progress/my-progress'
import { useCourses } from '@/hooks/api/courses/useCourses'
import { Community } from '@/components/pages/home/community/community'
import { useCompletedLessons } from '@/hooks/api/user/useCompletedLessons'
import { getCommunityEvents } from '@/lib/api/community'

export const Route = createFileRoute('/')({
  ssr: true,
  loader: async () => {
    const res = await getCommunityEvents()
    return { communityEvents: res?.data ?? [] }
  },
  head: () =>
    createPageMeta({
      title: 'Home',
      description:
        'Learn blockchain development with RedDuck Academy. Track your progress and browse interactive courses.',
      path: '/',
    }),
  component: App,
})

function App() {
  const { data: courses } = useCourses()
  const { data: completedLessons = [] } = useCompletedLessons()
  const { communityEvents } = Route.useLoaderData()

  return (
    <main className="flex flex-col min-h-screen">
      <Progress />
      <MyProgress courses={courses?.data ?? []} completedLessons={completedLessons} />
      <Community events={communityEvents} />
    </main>
  )
}
