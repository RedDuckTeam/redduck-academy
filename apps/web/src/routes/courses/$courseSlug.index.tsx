import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback } from 'react'
import { CoursesList } from '@/components/pages/courses/courses-list/courses-list'
import { getCourses } from '@/lib/api/courses'
import { CourseProgramSidebar } from '@/components/pages/courses/course-program-sidebar/course-program-sidebar'
import { createCoursesMeta } from '@/lib/seo'
import { useCompletedLessons } from '@/hooks/api/user/useCompletedLessons'
import { resolveFocusedCourse } from '@/lib/routes/courses-index-search'

export const Route = createFileRoute('/courses/$courseSlug/')({
  ssr: true,
  loader: async ({ params }) => {
    const res = await getCourses()
    const courses = res?.data ?? []

    if (!courses.some((c) => c.slug === params.courseSlug)) {
      throw redirect({
        to: '/courses/$courseSlug',
        params: { courseSlug: courses[0].slug },
      })
    }
    return { courses }
  },
  head: ({ loaderData, params }) => {
    const courses = loaderData?.courses ?? []
    const focusedCourse = resolveFocusedCourse(courses, params.courseSlug)
    return createCoursesMeta({ courses, focusedCourse })
  },
  component: CourseProgramHubPage,
})

function CourseProgramHubPage() {
  const { courses } = Route.useLoaderData()
  const { courseSlug } = Route.useParams()
  const navigate = Route.useNavigate()
  const { data: completedLessonsData } = useCompletedLessons()
  const completedLessonIds = new Set(completedLessonsData?.map((d) => d.lessonId) ?? [])

  const selectCourse = useCallback(
    (slug: string) => {
      if (!courses.some((c) => c.slug === slug)) return
      navigate({ to: '/courses/$courseSlug', params: { courseSlug: slug }, replace: true })
    },
    [courses, navigate],
  )

  return (
    <main className="flex min-h-screen gap-10 md:mx-[60px] mx-5 items-start">
      <CourseProgramSidebar
        courses={courses}
        selectedCourseSlug={courseSlug}
        onSelectCourse={selectCourse}
        className="max-md:hidden"
      />
      <div className="flex flex-col gap-5 w-full">
        <CoursesList courses={courses} courseSlug={courseSlug} completedLessons={completedLessonIds} />
      </div>
    </main>
  )
}
