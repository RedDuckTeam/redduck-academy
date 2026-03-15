import { ProjectSubmission } from './project-submission'
import type { Lesson } from '@/types/lesson'

interface LessonProjectProps {
  lesson: Lesson
}

export function LessonProject({ lesson: _lesson }: LessonProjectProps) {
  return (
    <div className="flex flex-col gap-10 w-full">
      <ProjectSubmission />
    </div>
  )
}
