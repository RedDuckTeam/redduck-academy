import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useCourse } from '@/hooks/api/courses/useCourse'
import { Text } from '@/components/ui/text'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { padIndex } from '@/lib/format-index'
import { cn } from '@/lib/utils'

export interface LessonSidebarListProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
  /** Recalculate selection triangle when panel becomes visible (e.g. drawer open). */
  isLayoutActive?: boolean
  /** Called when a lesson link is activated (e.g. close header drawer). */
  onSelect?: () => void
}

export const LessonSidebarList = ({
  courseSlug,
  moduleSlug,
  lessonSlug,
  isLayoutActive = true,
  onSelect,
}: LessonSidebarListProps) => {
  const [accordionOpen, setAccordionOpen] = useState(moduleSlug)
  const [syncedModuleSlug, setSyncedModuleSlug] = useState(moduleSlug)
  const [triangleTop, setTriangleTop] = useState(0)
  const selectedLessonRef = useRef<HTMLAnchorElement>(null)
  const { data: course } = useCourse(courseSlug)

  if (syncedModuleSlug !== moduleSlug) {
    setSyncedModuleSlug(moduleSlug)
    setAccordionOpen(moduleSlug)
  }

  useLayoutEffect(() => {
    const updatePosition = () => {
      const el = selectedLessonRef.current
      if (!el) return
      const top = el.offsetTop + el.offsetHeight / 2 - 12
      setTriangleTop(top)
    }

    updatePosition()
    const timeoutId = setTimeout(updatePosition, 350)
    window.addEventListener('resize', updatePosition)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePosition)
    }
  }, [lessonSlug, accordionOpen, isLayoutActive])

  return (
    <Accordion
      value={accordionOpen}
      onValueChange={setAccordionOpen}
      type="single"
      collapsible
      className="flex w-full min-w-0 flex-col divide-y divide-border"
    >
      {course?.data.modules.map((module, index) => (
        <AccordionItem key={module.id} value={module.slug}>
          <AccordionTrigger className="flex h-[60px] cursor-pointer items-center gap-5 px-5 py-[22px]">
            <Text variant="main-16" className="font-ibm-plex-mono text-primary">
              {padIndex(index)}.
            </Text>
            <Text variant="main-16" className="font-ibm-plex-mono uppercase text-[#e0deda]">
              {module.title}
            </Text>
          </AccordionTrigger>
          <AccordionContent className="flex divide-none">
            <div className="h-full w-5 shrink-0" />
            <div className="relative flex w-full min-w-0 flex-col gap-1 border-l border-border">
              {module.lessons.map((lesson, index) => (
                <Link
                  key={lesson.id}
                  ref={lesson.slug === lessonSlug ? selectedLessonRef : undefined}
                  to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
                  params={{
                    courseSlug: courseSlug,
                    moduleSlug: module.slug,
                    lessonSlug: lesson.slug,
                  }}
                  className={cn(index !== module.lessons.length - 1 && 'border-b border-border')}
                  onClick={() => onSelect?.()}
                >
                  <Text variant="main-16" className="px-[30px] py-5 text-[#e0deda]">
                    {lesson.title}
                  </Text>
                </Link>
              ))}
              {module.lessons.some((l) => l.slug === lessonSlug) && (
                <div
                  className="pointer-events-none absolute left-0 inline-block h-0 w-0 border-solid border-b-12 border-l-12 border-r-0 border-t-12 border-b-transparent border-l-primary border-r-transparent border-t-transparent transition-all duration-300"
                  style={{ top: `${triangleTop}px` }}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
