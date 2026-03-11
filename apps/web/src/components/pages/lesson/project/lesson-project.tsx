import { ProjectSubmission } from './project-submission'
import type { Lesson } from '@/types/lesson'
import { RichText } from '@/components/ui/rich-text'
import { Text } from '@/components/ui/text'

interface LessonProjectProps {
  lesson: Lesson
}

export function LessonProject({ lesson }: LessonProjectProps) {
  return (
    <div className="flex flex-col gap-10 w-full">
      {lesson.reviewDescription && <RichText data={lesson.reviewDescription} />}

      <ProjectSubmission />
    </div>
  )
}
