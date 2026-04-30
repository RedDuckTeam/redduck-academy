import { NavTile } from './nav-tile'
import type { Lesson } from '@/types/lesson'
import { useCourse } from '@/hooks/api/courses/useCourse'
import { useSession } from '@/hooks/useSession'
import { useMarkLessonCompleted } from '@/hooks/api/lessons/useMarkLessonCompleted'
import { useCourseAccess } from '@/hooks/api/user/useUserCourseAccess'

interface LessonNavigationProps {
  courseSlug: string
  lesson: Lesson
}

interface NavTarget {
  moduleSlug: string
  lessonSlug: string
  title: string
}

export const LessonNavigation = ({ courseSlug, lesson }: LessonNavigationProps) => {
  const { session } = useSession()
  const { data: course } = useCourse(courseSlug)
  const { mutate: markCompleted } = useMarkLessonCompleted()
  const courseAccess = useCourseAccess()

  const flat: NavTarget[] =
    course?.data.modules.flatMap((m) =>
      m.lessons.map((l) => ({ moduleSlug: m.slug, lessonSlug: l.slug, title: l.title })),
    ) ?? []
  const currentIndex = flat.findIndex((entry) => entry.lessonSlug === lesson.slug)
  const prev = currentIndex > 0 ? flat[currentIndex - 1] : null
  const next = currentIndex >= 0 && currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null

  const isLecture = lesson.type === 'lecture'
  const isCourseLocked = courseAccess.lockedSlugs.has(courseSlug)

  const handleNextClick = () => {
    if (session && isLecture && !isCourseLocked) {
      markCompleted({ courseSlug, lessonSlug: lesson.slug, lessonTitle: lesson.title })
    }
  }

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <NavTile direction="prev" target={prev} courseSlug={courseSlug} />
      <NavTile direction="next" target={next} courseSlug={courseSlug} onClick={handleNextClick} />
    </div>
  )
}

export type { NavTarget }
