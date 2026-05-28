import { createFileRoute, redirect } from '@tanstack/react-router'
import { coursesQueryOptions } from '@/hooks/api/courses/useCourses'
import { createCoursesMeta } from '@/lib/seo'

export const coursesRoute = '/courses/' as const

export const Route = createFileRoute('/courses/')({
  ssr: true,
  loader: async ({ context: { queryClient } }) => {
    const res = await queryClient.ensureQueryData(coursesQueryOptions())
    const courses = res?.data ?? []
    if (courses.length > 0) {
      throw redirect({
        to: '/courses/$courseSlug',
        params: { courseSlug: courses[0].slug },
      })
    }
    return { courses: [] }
  },
  head: () => createCoursesMeta({ courses: [] }),
  component: CoursesRootPage,
})

function CoursesRootPage() {
  return (
    <main className="mx-5 flex min-h-screen items-start lg:mx-[60px]">
      <p className="text-muted-foreground py-10">No courses available yet.</p>
    </main>
  )
}
