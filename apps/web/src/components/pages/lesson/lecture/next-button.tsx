import { useRouter } from '@tanstack/react-router'
import type { Lesson } from '@/types/lesson'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useMarkLessonCompleted } from '@/hooks/api/lessons/useMarkLessonCompleted'
import { useSession } from '@/hooks/useSession'
import { useCourseAccess } from '@/hooks/api/user/useUserCourseAccess'

interface NextButtonProps {
  courseSlug: string
  moduleSlug: string
  lesson: Lesson
  className?: string
}

export const NextButton = ({ courseSlug, moduleSlug, lesson, className }: NextButtonProps) => {
  const router = useRouter()
  const { session } = useSession()
  const { mutate: markCompleted } = useMarkLessonCompleted()
  const courseAccess = useCourseAccess()
  const isCourseLocked = courseAccess.lockedSlugs.has(courseSlug)
  const hasNext = lesson.next !== null
  const link = hasNext ? `/courses/${courseSlug}/${moduleSlug}/${lesson.next}` : `/courses/${courseSlug}`
  const isLecture = lesson.type === 'lecture'

  if (!session) {
    return (
      <Button onClick={() => router.navigate({ to: '/sign-up' })} className={className}>
        <Text variant={'caps-20'}>Sign in</Text>
      </Button>
    )
  }

  const handleClick = () => {
    if (isLecture && !isCourseLocked) {
      markCompleted({ courseSlug, lessonSlug: lesson.slug, lessonTitle: lesson.title })
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
