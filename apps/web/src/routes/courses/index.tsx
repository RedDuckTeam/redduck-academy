import { createFileRoute } from '@tanstack/react-router'
import { CoursesList } from '@/components/pages/courses/courses-list/courses-list'
import { getCourses } from '@/lib/api/courses'

export const coursesRoute = '/courses/' as const

export const Route = createFileRoute(coursesRoute)({
  ssr: true,
  loader: async () => {
    const courses = await getCourses()
    if (!courses) return { courses: [] }
    return { courses: courses.data }
  },
  component: CoursesIndexPage,
})

function CoursesIndexPage() {
  const { courses } = Route.useLoaderData()
  return (
    <main className="flex min-h-screen gap-10 mx-[60px]">
      <div></div>
      <div className="flex flex-col gap-5 w-full">
        <CoursesList courses={courses} />
      </div>
    </main>
  )
}
