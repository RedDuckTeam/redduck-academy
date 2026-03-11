import type { Lesson } from '@/types/lesson'
import { RichText } from '@/components/ui/rich-text'
import { Text } from '@/components/ui/text'

interface DescriptionPanelProps {
  lesson: Lesson
}

export function DescriptionPanel({ lesson }: DescriptionPanelProps) {
  return (
    <div className="flex flex-col gap-5 ">
      <Text variant="subtitle-32">{lesson.title}</Text>

      {lesson.description && <RichText data={lesson.description} />}
    </div>
  )
}
