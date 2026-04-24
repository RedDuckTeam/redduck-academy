import { useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import type { Ref } from 'react'
import { MenuIcon } from '@/components/ui/icons/menu'
import { ArrowRight } from '@/components/ui/icons/arrow-right'
import { Text } from '@/components/ui/text'
import { useCourse } from '@/hooks/api/courses/useCourse'
import { LessonSidebarList } from './lesson-sidebar-list'

interface LessonSidebarProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
}

export const LessonSidebar = ({ courseSlug, moduleSlug, lessonSlug }: LessonSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [parent] = useAutoAnimate({ duration: 200, easing: 'ease-in-out' })
  const { data: course } = useCourse(courseSlug)

  return (
    <div
      className="flex max-md:hidden flex-col overflow-hidden bg-sidebar transition-all duration-200 ease-in-out self-start"
      style={{ width: isOpen ? 380 : 60, minWidth: isOpen ? 380 : 60, height: isOpen ? 'auto' : 60 }}
    >
      <div
        ref={parent as Ref<HTMLDivElement>}
        className="flex max-h-[800px] min-w-[380px] flex-col divide-y divide-border overflow-y-auto"
      >
        {isOpen ? (
          <div className="flex w-full min-w-0 flex-col divide-y divide-border">
            <button
              type="button"
              className="flex h-[60px] w-full shrink-0 cursor-pointer items-center gap-5 px-5 text-left"
              onClick={() => setIsOpen(false)}
            >
              <ArrowRight className="shrink-0 rotate-180" />
              <Text variant="caps-20" className="truncate text-[#e0deda]">
                {course?.data.title}
              </Text>
            </button>
            <LessonSidebarList
              courseSlug={courseSlug}
              moduleSlug={moduleSlug}
              lessonSlug={lessonSlug}
              isLayoutActive={isOpen}
            />
          </div>
        ) : (
          <button
            type="button"
            className="flex h-[60px] w-[60px] shrink-0 cursor-pointer items-center justify-center"
            onClick={() => setIsOpen(true)}
          >
            <MenuIcon />
          </button>
        )}
      </div>
    </div>
  )
}
