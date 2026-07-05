import { useMemo } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import type { Course } from '@/types/lesson'
import type { CommunityEvent } from '@/types/community'
import { Progress } from '@/components/pages/home/progress/progress'
import { MyProgress } from '@/components/pages/home/my-progress/my-progress'
import { Community } from '@/components/pages/home/community/community'
import { useCompletedLessons } from '@/hooks/api/user/useCompletedLessons'
import { useCourseAccess } from '@/hooks/api/user/useUserCourseAccess'
import { useCourseProgress } from '@/hooks/api/user/useCourseProgress'
import { getCommunityEvents } from '@/lib/api/community'
import { coursesQueryOptions } from '@/hooks/api/courses/useCourses'
import { queryKeys } from '@/lib/query-keys'

// The home page is served at both `/` (indexable site root) and `/dashboard`
// (historical URL); both routes share this loader and component.

export interface HomePageData {
  courses: Course[]
  communityEvents: CommunityEvent[]
}

export async function loadHomePageData(queryClient: QueryClient): Promise<HomePageData> {
  const [communityRes, coursesRes] = await Promise.all([
    queryClient.ensureQueryData({
      queryKey: queryKeys.community.all(),
      queryFn: getCommunityEvents,
      staleTime: 10 * 60 * 1000,
    }),
    queryClient.ensureQueryData(coursesQueryOptions()),
  ])
  return {
    communityEvents: communityRes?.data ?? [],
    courses: coursesRes?.data ?? [],
  }
}

export function HomePage({ courses, communityEvents }: HomePageData) {
  const { data: completedLessons = [] } = useCompletedLessons()
  const courseAccess = useCourseAccess()
  const courseProgress = useCourseProgress(courses, completedLessons)

  const nextLesson = useMemo(() => {
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i]
      if (courseAccess.lockedSlugs.has(course.slug)) continue
      const next = courseProgress[i]?.nextLesson
      if (next) return { courseSlug: course.slug, courseTitle: course.title, ...next }
    }
    return null
  }, [courses, courseProgress, courseAccess.lockedSlugs])

  return (
    <main className="flex flex-col min-h-screen">
      <Progress nextLesson={nextLesson} hasProgress={completedLessons.length > 0} />
      <MyProgress courses={courses} completedLessons={completedLessons} courseAccess={courseAccess} />
      <Community events={communityEvents} />
    </main>
  )
}
