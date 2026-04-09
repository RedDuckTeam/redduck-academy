import type { Lesson, LessonForUser } from '@/types/lesson'
import { RichText } from '@/components/ui/rich-text'
import { Text } from '@/components/ui/text'
import { DucksBadge } from '@/components/ui/ducks-badge'

interface DescriptionPanelProps {
  lesson: Lesson
  userLesson: LessonForUser | null
}

export function DescriptionPanel({ lesson, userLesson }: DescriptionPanelProps) {
  return (
    <div className="flex flex-col gap-5 ">
      <div className="flex items-center justify-between gap-2">
        <Text variant="subtitle-32">{lesson.title}</Text>
        <DucksBadge myDucks={userLesson?.earnedPoints ?? null} ducks={lesson.maxPoints} />
      </div>

      {lesson.content && <RichText paragraphClassName="leading-[1.7]" data={lesson.content} />}
    </div>
  )
}
