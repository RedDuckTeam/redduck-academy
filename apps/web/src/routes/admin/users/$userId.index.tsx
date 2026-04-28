import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useCourses } from '@/hooks/api/courses/useCourses'
import { useAdminUserCompletedLessons } from '@/hooks/api/admin/useAdminUserCompletedLessons'
import { CourseProgramSidebar } from '@/components/pages/courses/course-program-sidebar/course-program-sidebar'
import { AdminCoursesList } from '@/components/pages/admin/users/admin-courses-list'
import { Text } from '@/components/ui/text'

export const Route = createFileRoute('/admin/users/$userId/')({
  component: AdminUserDetailPage,
})

function AdminUserDetailPage() {
  const { userId } = Route.useParams()
  const { email } = Route.useSearch()

  const { data: coursesResponse } = useCourses()
  const courses = coursesResponse?.data ?? []
  const { data: completedLessons = [], isPending } = useAdminUserCompletedLessons(userId)

  const completedLessonsSet = new Set(completedLessons.map((l) => l.lessonId))

  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>('')
  const activeCourseSlug = selectedCourseSlug || courses[0]?.slug || ''

  return (
    <main className="mx-5 min-h-screen py-10 lg:mx-[60px] flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link to="/admin" search={{ tab: 'users' as const }} className="text-secondary hover:text-black text-sm">
          ← Back to Admin
        </Link>
        <Text variant="subtitle-32" element="h1">
          {email || userId}
        </Text>
        {!isPending && (
          <Text variant="main-16" className="text-secondary">
            {completedLessons.length} lesson{completedLessons.length !== 1 ? 's' : ''} completed
          </Text>
        )}
      </div>

      {courses.length > 0 && (
        <div className="flex gap-0 border border-border">
          <CourseProgramSidebar
            courses={courses}
            selectedCourseSlug={activeCourseSlug}
            onSelectCourse={setSelectedCourseSlug}
          />
          <AdminCoursesList
            courses={courses}
            courseSlug={activeCourseSlug}
            completedLessons={completedLessonsSet}
            userId={userId}
          />
        </div>
      )}
    </main>
  )
}
