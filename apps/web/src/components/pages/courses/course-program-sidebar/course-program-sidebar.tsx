import { useLayoutEffect, useMemo, useState } from 'react'
import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'

interface CourseProgramSidebarProps {
  courses: Course[]
  selectedCourse: number
  setSelectedCourse: (course: number) => void
}

export const CourseProgramSidebar = ({ courses, selectedCourse, setSelectedCourse }: CourseProgramSidebarProps) => {
  const refs = useMemo(
    () => courses.map(() => ({ current: null }) as unknown as React.RefObject<HTMLButtonElement>),
    [courses.length],
  )
  const [triangleTop, setTriangleTop] = useState(0)

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (selectedCourse < 0 || selectedCourse >= refs.length) return
      const selectedRef = refs[selectedCourse]
      const top = selectedRef.current.offsetTop + selectedRef.current.offsetHeight / 2 - 15
      setTriangleTop(top)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [selectedCourse, refs])

  return (
    <div className="flex flex-col bg-black divide-y divide-[#565653] w-[380px]">
      <div className="h-[60px] px-5 flex items-center">
        <Text variant="caps-20" className="text-white">
          course program
        </Text>
      </div>
      <div className="relative flex flex-col divide-[#565653] divide-y">
        {courses.map((course, index) => (
          <button
            key={course.id}
            ref={refs[index]}
            className="flex items-center gap-5 py-[22px] px-5 cursor-pointer"
            onClick={() => setSelectedCourse(index)}
          >
            <Text variant="main-16" className="text-primary font-ibm-plex-mono">
              {index < 10 ? `0${index + 1}` : index + 1}.
            </Text>
            <Text variant="main-16" className="text-white font-ibm-plex-mono uppercase">
              {course.title}
            </Text>
          </button>
        ))}
        {courses.length > 0 && selectedCourse >= 0 && selectedCourse < courses.length && (
          <div
            className="absolute left-0 inline-block w-0 h-0 border-solid border-r-0 border-l-[12px] border-t-[12px] border-b-[12px] border-r-transparent border-l-primary border-t-transparent border-b-transparent transition-all duration-300"
            style={{ top: `${triangleTop}px` }}
          />
        )}
      </div>
    </div>
  )
}
