import { useMemo } from 'react'
import { MyProgressCourse } from './my-progress-course'
import type { CompletedLesson } from '@/lib/api/user'
import type { Course, CourseStatus } from '@/types/lesson'
import { CourseStatusEnum } from '@/types/lesson'
import { Text } from '@/components/ui/text'

interface MyProgressProps {
  courses: Course[]
  completedLessons: CompletedLesson[]
}

export const MyProgress = ({ courses, completedLessons }: MyProgressProps) => {
  const completedLessonIds = useMemo(() => new Set(completedLessons.map((c) => c.lessonId)), [completedLessons])

  const courseProgress = useMemo(() => {
    return courses.map((course) => {
      const totalCoursePoints = course.modules.reduce(
        (acc, module) => acc + module.lessons.reduce((sum, lesson) => sum + lesson.maxPoints, 0),
        0,
      )
      const earnedPoints = completedLessons
        .filter((c) => c.courseSlug === course.slug)
        .reduce((sum, c) => sum + c.pointsEarned, 0)

      const orderedLessons = course.modules
        .sort((a, b) => a.order - b.order)
        .flatMap((module) =>
          module.lessons
            .sort((a, b) => a.order - b.order)
            .map((lesson) => ({
              lessonId: lesson.id,
              lessonSlug: lesson.slug,
              moduleSlug: module.slug,
            })),
        )
      const nextLessonData = orderedLessons.find((item) => !completedLessonIds.has(item.lessonId))
      const nextLesson = nextLessonData
        ? {
            moduleSlug: nextLessonData.moduleSlug,
            lessonSlug: nextLessonData.lessonSlug,
          }
        : null

      const firstLesson = orderedLessons[0]
      let status: CourseStatus
      if (!nextLessonData) {
        status = CourseStatusEnum.COMPLETED
      } else if (nextLessonData.lessonId === firstLesson.lessonId) {
        status = CourseStatusEnum.START
      } else {
        status = CourseStatusEnum.CONTINUE
      }

      return { earnedPoints, totalCoursePoints, nextLesson, status }
    })
  }, [courses, completedLessons, completedLessonIds])

  return (
    <div className="flex flex-col  gap-5 sm:gap-10 bg-header px-6 py-14 md:px-10 md:py-[60px] xl:px-[60px] text-[#e0deda]">
      <Text variant={'subtitle-32'}>_MY PROGRESS</Text>
      <div className="hidden lg:grid grid-cols-10 border border-border">
        <div className="p-5 col-span-6">
          <Text variant={'caps-20'}>Courses</Text>
        </div>
        <div className="p-5 col-span-2 flex items-center justify-center">
          <Text variant={'caps-20'}>Points</Text>
        </div>
        <div className="p-5 col-span-2 flex items-center justify-center">
          <Text variant={'caps-20'}>Status</Text>
        </div>
        {courses.map((course, index) => (
          <MyProgressCourse
            key={course.id}
            layout="table"
            course={course}
            index={index}
            earnedPoints={courseProgress[index].earnedPoints}
            totalPoints={courseProgress[index].totalCoursePoints}
            nextLesson={courseProgress[index].nextLesson}
            status={courseProgress[index].status}
          />
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:hidden">
        {courses.map((course, index) => (
          <MyProgressCourse
            key={course.id}
            layout="card"
            course={course}
            index={index}
            earnedPoints={courseProgress[index].earnedPoints}
            totalPoints={courseProgress[index].totalCoursePoints}
            nextLesson={courseProgress[index].nextLesson}
            status={courseProgress[index].status}
          />
        ))}
      </div>
    </div>
  )
}
