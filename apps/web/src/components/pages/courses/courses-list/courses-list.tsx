import { Link } from '@tanstack/react-router'
import { Fragment } from 'react/jsx-runtime'
import type { Course } from '@/types/lesson'
import { LessonTypeEnum } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { lessonTypeToIcon, lessonTypeToLabel } from '@/lib/lessons/lessons'
import { padIndex } from '@/lib/format-index'
import { cn } from '@/lib/utils'
import { CheckIcon } from '@/components/ui/icons/check'

interface CoursesListProps {
  courses: Course[]
  courseSlug: string
  completedLessons: Set<number>
  lockedCourses?: Set<string>
}

export const CoursesList = ({ courses, courseSlug, completedLessons, lockedCourses }: CoursesListProps) => {
  if (!courses.length) return null
  const course = courses.find((c) => c.slug === courseSlug) ?? courses[0]
  return (
    <div className="flex flex-col border border-border divide-y divide-border">
      {course.modules.map((module, index) => (
        <Fragment key={module.slug}>
          <div className="p-5">
            <Text variant="caps-20" className="text-black">
              {padIndex(index)}. {module.title}
            </Text>
          </div>
          {module.lessons
            .sort((a, b) => a.order - b.order)
            .map((lesson) => {
              const isCompleted = completedLessons.has(lesson.id)
              const isLecture = lesson.type === LessonTypeEnum.LECTURE
              const isLocked = (lockedCourses?.has(course.slug) ?? false) && !isLecture
              const LessonTypeIcon = lessonTypeToIcon[lesson.type]

              const inner = (
                <>
                  <div
                    className={cn(
                      'w-[45px] h-[45px] flex items-center justify-center rounded-full border shrink-0',
                      isLocked ? 'border-black/30' : isCompleted ? 'border-success' : 'border-black',
                    )}
                  >
                    {isCompleted ? (
                      <CheckIcon className="[&_path]:fill-success" />
                    ) : (
                      <LessonTypeIcon className={cn('[&_path]:fill-black size-6', isLocked && 'opacity-30')} />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Text variant="main-18" className={isLocked ? 'text-black/30' : 'text-black'}>
                      {lesson.title}
                    </Text>
                    <Text variant="main-14" className={isLocked ? 'text-black/20' : 'text-secondary'}>
                      {lessonTypeToLabel[lesson.type]}
                    </Text>
                  </div>
                </>
              )

              if (isLocked) {
                return (
                  <div key={lesson.slug} className="py-4 px-5 flex items-center gap-5 cursor-not-allowed">
                    {inner}
                  </div>
                )
              }

              return (
                <Link
                  key={lesson.slug}
                  to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
                  params={{
                    courseSlug: course.slug,
                    moduleSlug: module.slug,
                    lessonSlug: lesson.slug,
                  }}
                  className="py-4 px-5 flex items-center gap-5"
                >
                  {inner}
                </Link>
              )
            })}
        </Fragment>
      ))}
    </div>
  )
}
