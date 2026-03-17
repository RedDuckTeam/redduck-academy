import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CoursesList } from '@/components/pages/courses/courses-list/courses-list'
import { getCourses } from '@/lib/api/courses'
import { CourseProgramSidebar } from '@/components/pages/courses/course-program-sidebar/course-program-sidebar'
import { createCoursesMeta } from '@/lib/seo'
import { useCompletedLessons } from '@/hooks/api/user/useCompletedLessons'

export const coursesRoute = '/courses/' as const

export const Route = createFileRoute(coursesRoute)({
  ssr: true,
  head: ({ loaderData }) => createCoursesMeta({ courses: loaderData?.courses ?? [] }),
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
  const { data: completedLessonsData } = useCompletedLessons()
  const completedLessonIds = new Set(completedLessonsData?.map((d) => d.lessonId) ?? [])

  return (
    <main className="flex min-h-screen gap-10 mx-[60px] items-start">
      <CourseProgramSidebar courses={courses} selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse} />
      <div className="flex flex-col gap-5 w-full">
        <CoursesList courses={courses} selectedCourse={selectedCourse} completedLessons={completedLessonIds} />
      </div>
    </main>
  )
}
