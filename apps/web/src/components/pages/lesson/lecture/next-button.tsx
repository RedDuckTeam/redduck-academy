import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { Lesson } from '@/types/lesson'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useMarkLessonCompleted } from '@/hooks/api/lessons/useMarkLessonCompleted'
import { completedLessonsQueryKey } from '@/hooks/api/user/useCompletedLessons'

interface NextButtonProps {
  courseSlug: string
  moduleSlug: string
  lesson: Lesson
  className?: string
}

export const NextButton = ({ courseSlug, moduleSlug, lesson, className }: NextButtonProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { mutateAsync: markCompleted } = useMarkLessonCompleted()
  const hasNext = lesson.next !== null
  const link = hasNext ? `/courses/${courseSlug}/${moduleSlug}/${lesson.next}` : '/courses'
  const isLecture = lesson.type === 'lecture'
  const handleClick = async () => {
    if (isLecture) {
      await markCompleted({ courseSlug, lessonSlug: lesson.slug })
    }
    if (!hasNext) {
      await queryClient.invalidateQueries({ queryKey: completedLessonsQueryKey })
    }
    router.navigate({ to: link })
  }

  return (
    <Button onClick={handleClick} variant={'outline'} className={className}>
      <Text className="" variant={'caps-20'}>
        {hasNext ? 'go to next lesson' : 'go to course program'}
      </Text>
    </Button>
  )
}
