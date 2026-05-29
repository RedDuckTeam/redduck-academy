import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import type { Course, CourseStatus } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { CheckIcon } from '@/components/ui/icons/check'
import { ArrowRight } from '@/components/ui/icons/arrow-right'
import { LockedCourseStatusTooltip } from '@/components/pages/home/my-progress/locked-course-status-tooltip'
import { cn } from '@/lib/utils'
import { padIndex } from '@/lib/format-index'

const statusLabels: Record<CourseStatus, string> = {
  start: 'Start',
  continue: 'Continue',
  completed: 'Completed',
}

interface MyProgressCourseProps {
  course: Course
  index: number
  completedLessons: number
  totalLessons: number
  nextLesson: { moduleSlug: string; lessonSlug: string } | null
  status: CourseStatus
  layout: 'table' | 'card'
  isLocked: boolean
  prerequisiteCourseTitle?: string
  prerequisiteCourseSlug?: string
  hasCertificate: boolean
}

type Action =
  | { kind: 'locked' }
  | { kind: 'next'; lesson: { moduleSlug: string; lessonSlug: string }; label: string }
  | { kind: 'claim' }
  | { kind: 'done'; label: string }

export const MyProgressCourse = ({
  course,
  index,
  completedLessons,
  totalLessons,
  nextLesson,
  status,
  layout,
  isLocked,
  prerequisiteCourseTitle,
  prerequisiteCourseSlug,
  hasCertificate,
}: MyProgressCourseProps) => {
  const indexLabel = padIndex(index)
  const pointsText = totalLessons > 0 ? `${completedLessons}/${totalLessons}` : '-'

  const action = useMemo<Action>(() => {
    if (isLocked) return { kind: 'locked' }
    if (nextLesson) return { kind: 'next', lesson: nextLesson, label: statusLabels[status] }
    if (!hasCertificate) return { kind: 'claim' }
    return { kind: 'done', label: statusLabels[status] }
  }, [isLocked, nextLesson, hasCertificate, status])

  const containerClass =
    layout === 'table'
      ? cn(
          'p-5 col-span-2 flex items-center justify-center border-t border-border',
          action.kind === 'locked' ? 'gap-3 min-h-[60px]' : 'gap-4',
        )
      : 'inline-flex flex-wrap items-center gap-2'

  let actionElement: React.ReactNode
  switch (action.kind) {
    case 'locked':
      actionElement = (
        <div className={containerClass}>
          <Text variant={'caps-20'}>Not available</Text>
          <LockedCourseStatusTooltip
            prerequisiteCourseTitle={prerequisiteCourseTitle}
            prerequisiteCourseSlug={prerequisiteCourseSlug}
          />
        </div>
      )
      break
    case 'next':
      actionElement = (
        <Link
          to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
          params={{
            courseSlug: course.slug,
            moduleSlug: action.lesson.moduleSlug,
            lessonSlug: action.lesson.lessonSlug,
          }}
          aria-label={`${action.label} ${course.title}`}
          className={containerClass}
        >
          <Text variant={'caps-20'}>{action.label}</Text>
          <ArrowRight />
        </Link>
      )
      break
    case 'claim':
      actionElement = (
        <Link
          to="/courses/$courseSlug"
          params={{ courseSlug: course.slug }}
          aria-label={`Claim certificate for ${course.title}`}
          className={containerClass}
        >
          <Text variant={'caps-20'}>Claim Certificate</Text>
          <ArrowRight />
        </Link>
      )
      break
    case 'done':
      actionElement = (
        <div className={containerClass}>
          <CheckIcon />
          <Text variant={'caps-20'}>{action.label}</Text>
        </div>
      )
      break
  }

  const titleInner = (
    <>
      <Text className="text-primary" variant={'caps-20'}>
        {indexLabel}.
      </Text>
      <Link
        to="/courses/$courseSlug"
        params={{ courseSlug: course.slug }}
        className="group inline-flex min-w-0 items-center gap-1.5"
      >
        <Text variant={'caps-20'} className="underline-offset-[0.2em] group-hover:underline">
          {course.title}
        </Text>
        <ArrowUpRight aria-hidden className="size-4 shrink-0" strokeWidth={2} />
      </Link>
    </>
  )

  if (layout === 'card') {
    return (
      <div className="flex flex-col gap-4 border border-border p-5">
        <div className="inline-flex flex-wrap items-center gap-2">{titleInner}</div>
        <div className="flex justify-between gap-6">
          <div className="flex min-w-0 flex-col gap-1">
            <Text variant="caps-12" className="text-border">
              Lessons
            </Text>
            <Text variant={'caps-20'}>{pointsText}</Text>
          </div>
          <div className="flex min-w-0 flex-col gap-1 col-span-8">
            <Text variant="caps-12" className="text-border">
              Status
            </Text>
            {actionElement}
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
      {actionElement}
    </>
  )
}
