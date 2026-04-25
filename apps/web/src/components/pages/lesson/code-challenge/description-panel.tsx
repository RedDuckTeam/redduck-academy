import type { Lesson, LessonForUser } from '@/types/lesson'
import { RichText } from '@/components/ui/rich-text'
import { Text } from '@/components/ui/text'

interface DescriptionPanelProps {
  lesson: Lesson
  userLesson: LessonForUser | null
}

export function DescriptionPanel({ lesson }: DescriptionPanelProps) {
  return (
    <div className="flex flex-col gap-5  overflow-y-auto max-h-[70vh]">
      <Text variant="subtitle-32" className="!min-h-auto">
        {lesson.title}
      </Text>
      {lesson.content && <RichText paragraphClassName="leading-[1.7] !mb-4 text-[16px]" data={lesson.content} />}
    </div>
  )
}
