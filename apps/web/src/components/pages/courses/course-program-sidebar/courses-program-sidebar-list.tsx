import { useLayoutEffect, useMemo, useState, type RefObject } from 'react'
import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { padIndex } from '@/lib/format-index'

export interface CoursesProgramSidebarListProps {
  courses: Course[]
  selectedCourseSlug: string
  onSelectCourse: (slug: string) => void
  className?: string
  /** Recalculate selection triangle when panel becomes visible (e.g. drawer open). */
  isLayoutActive?: boolean
  /** Called after `onSelectCourse` (e.g. close header drawer). */
  onSelect?: () => void
}

export const CoursesProgramSidebarList = ({
  courses,
  selectedCourseSlug,
  onSelectCourse,
  className,
  isLayoutActive = true,
  onSelect,
}: CoursesProgramSidebarListProps) => {
  const refs = useMemo(
    () => courses.map(() => ({ current: null }) as unknown as RefObject<HTMLButtonElement>),
    [courses.length],
  )
  const [triangleTop, setTriangleTop] = useState(0)

  const selectedIndex = useMemo(() => {
    const i = courses.findIndex((c) => c.slug === selectedCourseSlug)
    return i === -1 ? 0 : i
  }, [courses, selectedCourseSlug])

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (selectedIndex < 0 || selectedIndex >= refs.length) return
      const selectedRef = refs[selectedIndex]
      if (!selectedRef.current) return
      const top = selectedRef.current.offsetTop + selectedRef.current.offsetHeight / 2 - 15
      setTriangleTop(top)
    }

    updatePosition()
    const timeoutId = setTimeout(updatePosition, 350)
    window.addEventListener('resize', updatePosition)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePosition)
    }
  }, [selectedIndex, refs, isLayoutActive])

  return (
    <div className={cn('relative flex flex-col', className)}>
      {courses.map((course, index) => (
        <button
          key={course.id}
          ref={refs[index]}
          type="button"
          className={cn(
            'flex cursor-pointer items-center gap-5 px-5 py-[22px]',
            courses.length - 1 !== index ? 'border-b border-border' : '',
          )}
          onClick={() => {
            onSelectCourse(course.slug)
            onSelect?.()
          }}
        >
          <Text variant="main-16" className="font-ibm-plex-mono text-primary">
            {padIndex(index)}.
          </Text>
          <Text variant="main-16" className="font-ibm-plex-mono text-left uppercase text-white">
            {course.title}
          </Text>
        </button>
      ))}
      {courses.length > 0 && selectedIndex >= 0 && selectedIndex < courses.length && (
        <div
          className="absolute left-0 inline-block h-0 w-0 border-solid border-r-0 border-b-12 border-l-12 border-t-12 border-b-transparent border-l-primary border-r-transparent border-t-transparent transition-all duration-300"
          style={{ top: `${triangleTop}px` }}
        />
      )}
    </div>
  )
}
