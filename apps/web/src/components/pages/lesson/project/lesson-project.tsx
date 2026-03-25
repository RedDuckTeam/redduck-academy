import { ProjectSubmission } from './project-submission'
import type { Lesson } from '@/types/lesson'

interface LessonProjectProps {
  lesson: Lesson
  courseSlug: string
  lessonSlug: string
  moduleSlug: string
}

export function LessonProject({ lesson, courseSlug, lessonSlug, moduleSlug }: LessonProjectProps) {
  return (
    <div className="flex flex-col gap-10 w-full">
      <ProjectSubmission lesson={lesson} courseSlug={courseSlug} lessonSlug={lessonSlug} moduleSlug={moduleSlug} />
    </div>
  )
}
