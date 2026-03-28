import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { CoursesProgramSidebarList } from '@/components/pages/courses/course-program-sidebar/courses-program-sidebar-list'

interface CourseProgramSidebarProps {
  courses: Course[]
  selectedCourseSlug: string
  onSelectCourse: (slug: string) => void
  className?: string
  /** Recalculate selection triangle when panel becomes visible (e.g. drawer open). */
  isLayoutActive?: boolean
}

export const CourseProgramSidebar = ({
  courses,
  selectedCourseSlug,
  onSelectCourse,
  className,
  isLayoutActive = true,
}: CourseProgramSidebarProps) => {
  return (
    <div className={cn('flex w-[380px] flex-col bg-[#000000]', className)}>
      <div className="flex h-[60px] items-center border-b border-border px-5">
        <Text variant="caps-20" className="text-white">
          course program
        </Text>
      </div>
      <CoursesProgramSidebarList
        courses={courses}
        selectedCourseSlug={selectedCourseSlug}
        onSelectCourse={onSelectCourse}
        isLayoutActive={isLayoutActive}
      />
    </div>
  )
}
