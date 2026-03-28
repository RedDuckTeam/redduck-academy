import { getRouteApi } from '@tanstack/react-router'
import { useCallback } from 'react'
import { CoursesProgramSidebarList } from '@/components/pages/courses/course-program-sidebar/courses-program-sidebar-list'
import { useCourses } from '@/hooks/api/courses/useCourses'

const courseProgramHubRoute = getRouteApi('/courses/$courseSlug/')

interface HeaderMenuCoursesListProps {
  open: boolean
  courseSlug: string
  onSelect?: () => void
}

export function HeaderMenuCoursesList({ open, courseSlug, onSelect }: HeaderMenuCoursesListProps) {
  const { data: coursesData } = useCourses()
  const courses = coursesData?.data ?? []

  const navigate = courseProgramHubRoute.useNavigate()

  const selectCourse = useCallback(
    (slug: string) => {
      if (!courses.some((c) => c.slug === slug)) return
      navigate({ to: '/courses/$courseSlug', params: { courseSlug: slug }, replace: true })
    },
    [courses, navigate],
  )

  if (!courses.length) return null

  return (
    <CoursesProgramSidebarList
      courses={courses}
      selectedCourseSlug={courseSlug}
      onSelectCourse={selectCourse}
      className="w-full min-w-0"
      isLayoutActive={open}
      onSelect={onSelect}
    />
  )
}
