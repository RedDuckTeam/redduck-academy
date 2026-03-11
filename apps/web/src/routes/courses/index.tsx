import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { Course } from '@/types/lesson'
import { CoursesList } from '@/components/pages/courses/courses-list/courses-list'
import { getCourses } from '@/lib/api/courses'
import { CourseProgramSidebar } from '@/components/pages/courses/course-program-sidebar/course-program-sidebar'

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
  const [selectedCourse, setSelectedCourse] = useState<number>(0)
  return (
    <main className="flex min-h-screen gap-10 mx-[60px] items-start">
      <CourseProgramSidebar
        courses={courses}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
      />
      <div className="flex flex-col gap-5 w-full">
        <CoursesList courses={courses} selectedCourse={selectedCourse} />
      </div>
    </main>
  )
}
