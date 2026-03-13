import { Link, createFileRoute } from '@tanstack/react-router'
import { Progress } from '@/components/pages/home/progress/progress'
import { createPageMeta } from '@/lib/seo'
import { MyProgress } from '@/components/pages/home/my-progress/my-progress'
import { useCourses } from '@/hooks/api/courses/useCourses'
import { Community } from '@/components/pages/home/community/community'

export const Route = createFileRoute('/')({
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
  return (
    <main className="flex flex-col min-h-screen">
      <Progress />
      <MyProgress courses={courses?.data ?? []} />
      <Community />
    </main>
  )
}
