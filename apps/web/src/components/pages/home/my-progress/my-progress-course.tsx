import { Link } from '@tanstack/react-router'
import type { Course, CourseStatus } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { CheckIcon } from '@/components/ui/icons/check'
import { ArrowRight } from '@/components/ui/icons/arrow-right'
import { cn } from '@/lib/utils'

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
  layout: 'table' | 'card'
}

export const MyProgressCourse = ({
  course,
  index,
  earnedPoints,
  totalPoints,
  nextLesson,
  status,
  layout,
}: MyProgressCourseProps) => {
  const indexLabel = index < 10 ? `0${index + 1}` : index + 1
  const pointsText = totalPoints > 0 ? `${earnedPoints}/${totalPoints}` : '-'

  const titleInner = (
    <>
      <Text className="text-primary" variant={'caps-20'}>
        {indexLabel}.
      </Text>
      <Link to="/courses/$courseSlug" params={{ courseSlug: course.slug }}>
        <Text variant={'caps-20'}>{course.title}</Text>
      </Link>
    </>
  )

  const statusBlock = nextLesson ? (
    <Link
      to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
      params={{
        courseSlug: course.slug,
        moduleSlug: nextLesson.moduleSlug,
        lessonSlug: nextLesson.lessonSlug,
      }}
      className={cn(
        'gap-4 flex items-center',
        layout === 'table' && 'p-5 col-span-2 justify-center border-t border-border',
      )}
    >
      <Text variant={'caps-20'}>{statusLabels[status]}</Text>
      <ArrowRight />
    </Link>
  ) : (
    <div
      className={cn(
        'gap-4 flex items-center',
        layout === 'table' && 'p-5 col-span-2 justify-center border-t border-border',
      )}
    >
      <CheckIcon />
      <Text variant={'caps-20'}>{statusLabels[status]}</Text>
    </div>
  )

  const cardStatusValue = nextLesson ? (
    <Link
      to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
      params={{
        courseSlug: course.slug,
        moduleSlug: nextLesson.moduleSlug,
        lessonSlug: nextLesson.lessonSlug,
      }}
      className="inline-flex flex-wrap items-center gap-2"
    >
      <Text variant={'caps-20'}>{statusLabels[status]}</Text>
      <ArrowRight />
    </Link>
  ) : (
    <div className="inline-flex flex-wrap items-center gap-2">
      <CheckIcon />
      <Text variant={'caps-20'}>{statusLabels[status]}</Text>
    </div>
  )

  if (layout === 'card') {
    return (
      <div className="flex flex-col gap-4 border border-border p-5">
        <div className="inline-flex flex-wrap items-center gap-2">{titleInner}</div>
        <div className="flex justify-between gap-6">
          <div className="flex min-w-0 flex-col gap-1">
            <Text variant="caps-12" className="text-border">
              Points
            </Text>
            <Text variant={'caps-20'}>{pointsText}</Text>
          </div>
          <div className="flex min-w-0 flex-col gap-1 items-end text-right">
            <Text variant="caps-12" className="text-border">
              Status
            </Text>
            {cardStatusValue}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-5 col-span-6 flex items-center gap-5 border-r border-border border-t ">{titleInner}</div>
      <div className="p-5 col-span-2 flex items-center justify-center border-r border-border border-t ">
        <Text variant={'caps-20'}>{pointsText}</Text>
      </div>
      {statusBlock}
    </>
  )
}
