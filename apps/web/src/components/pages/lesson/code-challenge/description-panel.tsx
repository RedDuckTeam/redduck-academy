import type { Lesson, LessonForUser } from '@/types/lesson'
import { RichText } from '@/components/content/rich-text'
import { MarkdownContent } from '@/components/content/markdown-content'
import { Text } from '@/components/ui/text'
import { lessonRouteApi } from '@/lib/routes/lesson-route'

interface DescriptionPanelProps {
  lesson: Lesson
  userLesson: LessonForUser | null
}

export function DescriptionPanel({ lesson }: DescriptionPanelProps) {
  const { lessonBody } = lessonRouteApi.useLoaderData()
  const paragraphClassName = 'leading-[1.7] !mb-4 text-[16px]'
  return (
    <div className="flex flex-col gap-5 min-h-0 flex-1">
      <Text variant="subtitle-32" className="!min-h-auto">
        {lesson.title}
      </Text>
      {lessonBody != null ? (
        <MarkdownContent source={lessonBody} paragraphClassName={paragraphClassName} />
      ) : lesson.content ? (
        <RichText paragraphClassName={paragraphClassName} data={lesson.content} />
      ) : null}
    </div>
  )
}
