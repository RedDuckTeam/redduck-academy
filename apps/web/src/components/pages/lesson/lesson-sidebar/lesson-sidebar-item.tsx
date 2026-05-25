import { forwardRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Text } from '@/components/ui/text'
import { CheckIcon } from '@/components/ui/icons/check'
import { lessonTypeToIcon, lessonTypeToLabel } from '@/lib/lessons/lessons'
import { cn } from '@/lib/utils'
import type { Lesson } from '@/types/lesson'

interface LessonSidebarItemProps {
  courseSlug: string
  moduleSlug: string
  lesson: Lesson
  isCompleted: boolean
  isLast: boolean
  onSelect?: () => void
}

export const LessonSidebarItem = forwardRef<HTMLAnchorElement, LessonSidebarItemProps>(
  ({ courseSlug, moduleSlug, lesson, isCompleted, isLast, onSelect }, ref) => {
    const [parent] = useAutoAnimate({ duration: 200, easing: 'ease-in-out' })
    const TypeIcon = lessonTypeToIcon[lesson.type]

    return (
      <Link
        ref={ref}
        to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
        params={{ courseSlug, moduleSlug, lessonSlug: lesson.slug }}
        className={cn(!isLast && 'border-b border-border')}
        onClick={() => onSelect?.()}
      >
        <div ref={parent} className="flex items-center gap-3 px-[20px] py-5">
          <Text variant="main-16" className="min-w-0 flex-1 text-[#e0deda]">
            {lesson.title}
          </Text>
          <span
            className="size-5 shrink-0"
            title={isCompleted ? `${lessonTypeToLabel[lesson.type]} — completed` : lessonTypeToLabel[lesson.type]}
          >
            {isCompleted ? (
              <CheckIcon className="size-5 [&_path]:fill-primary" />
            ) : (
              <TypeIcon className="size-5 [&_path]:fill-[#e0deda]" />
            )}
          </span>
        </div>
      </Link>
    )
  },
)
LessonSidebarItem.displayName = 'LessonSidebarItem'
