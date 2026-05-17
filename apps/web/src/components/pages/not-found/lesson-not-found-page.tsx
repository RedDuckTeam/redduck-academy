import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

interface LessonNotFoundPageProps {
  courseSlug: string
}

export const LessonNotFoundPage = ({ courseSlug }: LessonNotFoundPageProps) => {
  return (
    <main className="flex flex-col items-center justify-center py-20 sm:py-40 gap-8 px-6 text-center">
      <Text variant="title-80" className="text-primary">
        404
      </Text>
      <Text variant="subtitle-45">Lesson not found</Text>
      <Button asChild>
        <Link to="/courses/$courseSlug" params={{ courseSlug }}>
          <Text variant="caps-24">Back to course program</Text>
        </Link>
      </Button>
    </main>
  )
}
