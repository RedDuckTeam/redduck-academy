import { createFileRoute } from '@tanstack/react-router'
import { AdminLessonSubmissionsPage } from '@/components/pages/admin/lessons/lesson-submissions-page'

export const Route = createFileRoute('/admin/lessons/$courseSlug/$lessonSlug')({
  ssr: false,
  component: AdminLessonSubmissionsPage,
})
