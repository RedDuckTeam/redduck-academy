import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback } from 'react'
import { CoursesList } from '@/components/pages/courses/courses-list/courses-list'
import { coursesQueryOptions } from '@/hooks/api/courses/useCourses'
import { CourseProgramSidebar } from '@/components/pages/courses/course-program-sidebar/course-program-sidebar'
import { CourseProgramHeader } from '@/components/pages/courses/course-program-header/course-program-header'
import { createCoursesMeta } from '@/lib/seo'
import { useCompletedLessons } from '@/hooks/api/user/useCompletedLessons'
import { useCourseAccess } from '@/hooks/api/user/useUserCourseAccess'
import { resolveFocusedCourse } from '@/lib/routes/courses-index-search'

export const Route = createFileRoute('/courses/$courseSlug/')({
  ssr: true,
  loader: async ({ params, context: { queryClient } }) => {
    const res = await queryClient.ensureQueryData(coursesQueryOptions())
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
  const courseAccess = useCourseAccess()

  const selectCourse = useCallback(
    (slug: string) => {
      if (!courses.some((c) => c.slug === slug)) return
      navigate({ to: '/courses/$courseSlug', params: { courseSlug: slug }, replace: true })
    },
    [courses, navigate],
  )

  const focusedCourse = courses.find((c) => c.slug === courseSlug) ?? courses[0]

  return (
    <main className="flex min-h-screen gap-10  lg:mx-[60px] mx-5 items-start">
      <CourseProgramSidebar
        courses={courses}
        selectedCourseSlug={courseSlug}
        onSelectCourse={selectCourse}
        className="max-md:hidden"
      />
      <div className="flex flex-col gap-5 w-full pb-10">
        <CourseProgramHeader
          course={focusedCourse}
          completedLessons={completedLessonIds}
          isLocked={courseAccess.lockedSlugs.has(focusedCourse?.slug ?? '')}
          prerequisiteCourseSlug={courseAccess.prerequisiteSlugByCourseSlug.get(focusedCourse?.slug ?? '')}
          prerequisiteCourseTitle={courseAccess.prerequisiteTitleByCourseSlug.get(focusedCourse?.slug ?? '')}
        />
        <CoursesList
          courses={courses}
          courseSlug={courseSlug}
          completedLessons={completedLessonIds}
          lockedCourses={courseAccess.lockedSlugs}
        />
      </div>
    </main>
  )
}
