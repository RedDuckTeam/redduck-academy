import { useLayoutEffect, useRef, useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Link } from '@tanstack/react-router'
import type { Ref } from 'react'
import { useCourse } from '@/hooks/api/courses/useCourse'
import { Text } from '@/components/ui/text'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MenuIcon } from '@/components/ui/icons/menu'
import { ArrowRight } from '@/components/ui/icons/arrow-right'

interface LessonSidebarProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
}

export const LessonSidebar = ({ courseSlug, moduleSlug, lessonSlug }: LessonSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState(moduleSlug)
  const [triangleTop, setTriangleTop] = useState(0)
  const selectedLessonRef = useRef<HTMLAnchorElement>(null)
  const { data: course } = useCourse(courseSlug)

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
  }, [lessonSlug, accordionOpen, isOpen])

  const [parent] = useAutoAnimate({ duration: 200, easing: 'ease-in-out' })
  return (
    <div
      className="flex flex-col bg-black overflow-hidden transition-all duration-200 ease-in-out"
      style={{ width: isOpen ? 380 : 60, height: isOpen ? '100%' : 60 }}
    >
      <div
        ref={parent as Ref<HTMLDivElement>}
        className="flex flex-col min-w-[380px] divide-y divide-border max-h-[800px] overflow-y-auto"
      >
        {isOpen ? (
          <>
            <button
              className="h-[60px] px-5 flex items-center gap-5 cursor-pointer shrink-0"
              onClick={() => setIsOpen(false)}
            >
              <ArrowRight className="rotate-180 shrink-0" />
              <Text variant="caps-20" className="text-white truncate">
                {course?.data.title}
              </Text>
            </button>
            <Accordion
              value={accordionOpen}
              onValueChange={setAccordionOpen}
              type="single"
              collapsible
              className="flex flex-col divide-border divide-y"
            >
              {course?.data.modules.map((module, index) => (
                <AccordionItem key={module.id} value={module.slug}>
                  <AccordionTrigger className="h-[60px] flex items-center gap-5 py-[22px] px-5 cursor-pointer">
                    <Text variant="main-16" className="text-primary font-ibm-plex-mono">
                      {index < 10 ? `0${index + 1}` : index + 1}.
                    </Text>
                    <Text variant="main-16" className="text-white font-ibm-plex-mono uppercase">
                      {module.title}
                    </Text>
                  </AccordionTrigger>
                  <AccordionContent className="flex">
                    <div className="w-5 h-full" />
                    <div className="flex flex-col gap-1 relative border-l border-border divide-y divide-border w-full">
                      {module.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          ref={lesson.slug === lessonSlug ? selectedLessonRef : undefined}
                          to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
                          params={{
                            courseSlug: courseSlug,
                            moduleSlug: module.slug,
                            lessonSlug: lesson.slug,
                          }}
                        >
                          <Text key={lesson.id} variant="main-16" className="text-white px-[30px] py-5">
                            {lesson.title}
                          </Text>
                        </Link>
                      ))}
                      {module.lessons.some((l) => l.slug === lessonSlug) && (
                        <div
                          className="absolute left-0 inline-block w-0 h-0 border-solid border-r-0 border-l-12 border-t-12 border-b-12 border-r-transparent border-l-primary border-t-transparent border-b-transparent transition-all duration-300 pointer-events-none"
                          style={{ top: `${triangleTop}px` }}
                        />
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </>
        ) : (
          <button
            className="w-[60px] h-[60px] flex items-center justify-center cursor-pointer shrink-0"
            onClick={() => setIsOpen(true)}
          >
            <MenuIcon />
          </button>
        )}
      </div>
    </div>
  )
}
