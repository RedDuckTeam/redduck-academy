import { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Progress } from '@/components/pages/home/progress/progress'
import { createPageMeta } from '@/lib/seo'
import { MyProgress } from '@/components/pages/home/my-progress/my-progress'
import { Community } from '@/components/pages/home/community/community'
import { useCompletedLessons } from '@/hooks/api/user/useCompletedLessons'
import { useCourseAccess } from '@/hooks/api/user/useUserCourseAccess'
import { useCourseProgress } from '@/hooks/api/user/useCourseProgress'
import { getCommunityEvents } from '@/lib/api/community'
import { getCourses } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'

export const Route = createFileRoute('/dashboard')({
  ssr: true,
  loader: async ({ context: { queryClient } }) => {
    const [communityRes, coursesRes] = await Promise.all([
      queryClient.ensureQueryData({
        queryKey: queryKeys.community.all(),
        queryFn: getCommunityEvents,
        staleTime: 10 * 60 * 1000,
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.courses.all(),
        queryFn: getCourses,
        staleTime: 30 * 60 * 1000,
      }),
    ])
    return {
      communityEvents: communityRes?.data ?? [],
      courses: coursesRes?.data ?? [],
    }
  },
  head: () =>
    createPageMeta({
      title: 'Home',
      description:
        'Learn blockchain development with RedDuck Academy. Track your progress and browse interactive courses.',
      path: '/dashboard',
    }),
  component: Dashboard,
})

function Dashboard() {
  const { courses, communityEvents } = Route.useLoaderData()
  const { data: completedLessons = [] } = useCompletedLessons()
  const courseAccess = useCourseAccess()
  const courseProgress = useCourseProgress(courses, completedLessons)

  const nextLesson = useMemo(() => {
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i]
      if (courseAccess.lockedSlugs.has(course.slug)) continue
      const next = courseProgress[i]?.nextLesson
      if (next) return { courseSlug: course.slug, ...next }
    }
    return null
  }, [courses, courseProgress, courseAccess.lockedSlugs])

  return (
    <main className="flex flex-col min-h-screen">
      <Progress nextLesson={nextLesson} />
      <MyProgress courses={courses} completedLessons={completedLessons} courseAccess={courseAccess} />
      <Community events={communityEvents} />
    </main>
  )
}
