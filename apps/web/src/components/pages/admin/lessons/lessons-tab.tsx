import { useMemo, useState } from 'react'
import { Text } from '@/components/ui/text'
import { useCourses } from '@/hooks/api/courses/useCourses'
import { useAdminLessonsTree } from '@/hooks/api/admin/useAdminLessonsTree'
import { CourseProgramSidebar } from '@/components/pages/courses/course-program-sidebar/course-program-sidebar'
import type { AdminLessonTreeLesson } from '@/lib/api/admin'
import { AdminLessonsList } from './admin-lessons-list'

function StatusBox({ children }: { children: string }) {
  return (
    <div className="border border-border p-10 text-center">
      <Text variant="caps-20" className="text-muted-foreground">
        {children}
      </Text>
    </div>
  )
}

export function AdminLessonsTab() {
  const { data: coursesResponse, isPending, isError, error } = useCourses()
  const courses = coursesResponse?.data ?? []
  const { data: tree } = useAdminLessonsTree()

  // Course/module/lesson structure comes from the shared courses query (so the layout matches the
  // user-detail view exactly); per-lesson submission counts are overlaid from the admin tree by id.
  const statsByLessonId = useMemo(() => {
    const map = new Map<number, AdminLessonTreeLesson>()
    for (const course of tree ?? []) {
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) map.set(lesson.id, lesson)
      }
    }
    return map
  }, [tree])

  const [selectedCourseSlug, setSelectedCourseSlug] = useState('')
  const activeCourseSlug = selectedCourseSlug || courses[0]?.slug || ''

  if (isPending) return <StatusBox>LOADING…</StatusBox>
  if (isError) return <StatusBox>{error?.message?.toUpperCase() ?? 'FAILED TO LOAD LESSONS'}</StatusBox>
  if (courses.length === 0) return <StatusBox>NO COURSES FOUND</StatusBox>

  return (
    <div className="flex border border-border">
      <CourseProgramSidebar
        courses={courses}
        selectedCourseSlug={activeCourseSlug}
        onSelectCourse={setSelectedCourseSlug}
      />
      <AdminLessonsList courses={courses} courseSlug={activeCourseSlug} statsByLessonId={statsByLessonId} />
    </div>
  )
}
