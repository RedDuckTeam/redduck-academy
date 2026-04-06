import { Link } from '@tanstack/react-router'
import type { Course, CourseStatus } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { CheckIcon } from '@/components/ui/icons/check'
import { ArrowRight } from '@/components/ui/icons/arrow-right'

const statusLabels: Record<CourseStatus, string> = {
  start: 'Start',
  continue: 'Continue',
  completed: 'Completed',
}

interface MyProgressCourseProps {
  course: Course
  index: number
  earnedPoints: number
  totalPoints: number
  nextLesson: { moduleSlug: string; lessonSlug: string } | null
  status: CourseStatus
}

export const MyProgressCourse = ({
  course,
  index,
  earnedPoints,
  totalPoints,
  nextLesson,
  status,
}: MyProgressCourseProps) => {
  return (
    <>
      <div className="p-5 col-span-6 flex items-center gap-5 border-r border-border border-t ">
        <Text className="text-primary" variant={'caps-20'}>
          {index < 10 ? `0${index + 1}` : index + 1}.
        </Text>
        <Link to="/courses/$courseSlug" params={{ courseSlug: course.slug }}>
          <Text variant={'caps-20'}>{course.title}</Text>
        </Link>
      </div>
      <div className="p-5 col-span-2 flex items-center justify-center border-r border-border border-t ">
        <Text variant={'caps-20'}>{totalPoints > 0 ? `${earnedPoints}/${totalPoints}` : '-'}</Text>
      </div>
      {nextLesson ? (
        <Link
          to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
          params={{
            courseSlug: course.slug,
            moduleSlug: nextLesson.moduleSlug,
            lessonSlug: nextLesson.lessonSlug,
          }}
          className="p-5 col-span-2 gap-4 flex items-center justify-center border-t border-border"
        >
          <Text variant={'caps-20'}>{statusLabels[status]}</Text>
          <ArrowRight />
        </Link>
      ) : (
        <div className="p-5 col-span-2 gap-4 flex items-center justify-center border-t border-border">
          <CheckIcon />
          <Text variant={'caps-20'}>{statusLabels[status]}</Text>
        </div>
      )}
    </>
  )
}
