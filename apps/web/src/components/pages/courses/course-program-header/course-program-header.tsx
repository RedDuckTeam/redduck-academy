import { Link } from '@tanstack/react-router'
import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { LockedCourseBadge } from '@/components/pages/home/my-progress/locked-course-badge'
import { isCourseFullyCompleted } from '@/lib/lessons/course-completion'
import { cn } from '@/lib/utils'
import { useUserCertificates } from '@/hooks/api/certificates/useUserCertificates'

interface CourseProgramHeaderProps {
  course: Course
  completedLessons: Set<number>
  isLocked?: boolean
  prerequisiteCourseSlug?: string
  prerequisiteCourseTitle?: string
  className?: string
}

export const CourseProgramHeader = ({
  course,
  completedLessons,
  isLocked,
  prerequisiteCourseSlug,
  prerequisiteCourseTitle,
  className,
}: CourseProgramHeaderProps) => {
  const showCertificate = isCourseFullyCompleted(course, completedLessons)
  const { data: certificates } = useUserCertificates()
  const isClaimed = certificates?.some((c) => c.courseSlug === course.slug) ?? false

  return (
    <section
      className={cn('flex gap-5 bg-[#e0cdc6] p-5 md:p-10 max-md:flex-col max-md:gap-8', className)}
      aria-labelledby="course-program-title"
    >
      <div className="flex min-w-0 min-h-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Text id="course-program-title" element="h1" variant="subtitle-32" className="text-[#000]">
            {course.title}_
          </Text>
          {isLocked ? (
            <LockedCourseBadge
              prerequisiteCourseTitle={prerequisiteCourseTitle}
              prerequisiteCourseSlug={prerequisiteCourseSlug}
            />
          ) : showCertificate ? (
            <Button className="text-[#000]" asChild>
              <Link to="/courses/$courseSlug/certificate" params={{ courseSlug: course.slug }}>
                {isClaimed ? 'View Certificate' : 'Claim Certificate'}
              </Link>
            </Button>
          ) : null}
        </div>
        <Text variant="main-16" className="text-[#000]">
          {course.description}
        </Text>
      </div>
    </section>
  )
}
