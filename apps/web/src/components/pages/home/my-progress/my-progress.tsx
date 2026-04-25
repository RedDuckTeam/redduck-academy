import { MyProgressCourse } from './my-progress-course'
import type { CompletedLesson } from '@/lib/api/user'
import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import type { UserCourseAccessState } from '@/hooks/api/user/useUserCourseAccess'
import { useCourseProgress } from '@/hooks/api/user/useCourseProgress'

interface MyProgressProps {
  courses: Course[]
  completedLessons: CompletedLesson[]
  courseAccess: UserCourseAccessState
}

export const MyProgress = ({ courses, completedLessons, courseAccess }: MyProgressProps) => {
  const courseProgress = useCourseProgress(courses, completedLessons)

  return (
    <div className="flex flex-col  gap-5 sm:gap-10 bg-header px-6 py-14 md:px-10 md:py-[60px] xl:px-[60px] text-[#e0deda]">
      <Text variant={'subtitle-32'}>_MY PROGRESS</Text>
      <div className="hidden lg:grid grid-cols-10 border border-border">
        <div className="p-5 col-span-6">
          <Text variant={'caps-20'}>Courses</Text>
        </div>
        <div className="p-5 col-span-2 flex items-center justify-center">
          <Text variant={'caps-20'}>Lessons</Text>
        </div>
        <div className="p-5 col-span-2 flex items-center justify-center">
          <Text variant={'caps-20'}>Status</Text>
        </div>
        {courses.map((course, index) => (
          <MyProgressCourse
            key={course.id}
            completedLessons={completedLessons.filter((c) => c.courseSlug === course.slug).length}
            totalLessons={course.modules.flatMap((m) => m.lessons).length}
            layout="table"
            course={course}
            index={index}
            isLocked={courseAccess.lockedSlugs.has(course.slug)}
            prerequisiteCourseTitle={courseAccess.prerequisiteTitleByCourseSlug.get(course.slug)}
            prerequisiteCourseSlug={courseAccess.prerequisiteSlugByCourseSlug.get(course.slug)}
            nextLesson={courseProgress[index].nextLesson}
            status={courseProgress[index].status}
          />
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:hidden">
        {courses.map((course, index) => (
          <MyProgressCourse
            key={course.id}
            completedLessons={completedLessons.filter((c) => c.courseSlug === course.slug).length}
            totalLessons={course.modules.flatMap((m) => m.lessons).length}
            layout="card"
            course={course}
            index={index}
            isLocked={courseAccess.lockedSlugs.has(course.slug)}
            prerequisiteCourseTitle={courseAccess.prerequisiteTitleByCourseSlug.get(course.slug)}
            prerequisiteCourseSlug={courseAccess.prerequisiteSlugByCourseSlug.get(course.slug)}
            nextLesson={courseProgress[index].nextLesson}
            status={courseProgress[index].status}
          />
        ))}
      </div>
    </div>
  )
}
