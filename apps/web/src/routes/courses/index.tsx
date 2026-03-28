import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCourses } from '@/lib/api/courses'
import { createCoursesMeta } from '@/lib/seo'

export const coursesRoute = '/courses/' as const

export const Route = createFileRoute(coursesRoute)({
  ssr: true,
  head: () => createCoursesMeta({ courses: [] }),
  loader: async () => {
    const res = await getCourses()
    const courses = res?.data ?? []
    if (courses.length > 0) {
      throw redirect({
        to: '/courses/$courseSlug',
        params: { courseSlug: courses[0].slug },
      })
    }
    return { courses: [] }
  },
  component: CoursesRootPage,
})

function CoursesRootPage() {
  return (
    <main className="mx-5 flex min-h-screen items-start md:mx-[60px]">
      <p className="text-muted-foreground py-10">No courses available yet.</p>
    </main>
  )
}
