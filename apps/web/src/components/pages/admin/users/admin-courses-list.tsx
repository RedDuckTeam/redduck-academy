import { Link } from '@tanstack/react-router'
import { Fragment } from 'react/jsx-runtime'
import type { Course } from '@/types/lesson'
import { LessonTypeEnum } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { lessonTypeToIcon, lessonTypeToLabel } from '@/lib/lessons/lessons'
import { cn } from '@/lib/utils'
import { CheckIcon } from '@/components/ui/icons/check'
import { padIndex } from '@/lib/format-index'

interface AdminCoursesListProps {
  courses: Course[]
  courseSlug: string
  completedLessons: Set<number>
  userId: string
}

export const AdminCoursesList = ({ courses, courseSlug, completedLessons, userId }: AdminCoursesListProps) => {
  if (!courses.length) return null
  const course = courses.find((c) => c.slug === courseSlug) ?? courses[0]
  return (
    <div className="flex flex-col border border-border divide-y divide-border flex-1">
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
              const LessonTypeIcon = lessonTypeToIcon[lesson.type]

              return (
                <Link
                  key={lesson.slug}
                  to="/admin/users/$userId/$courseSlug/$lessonSlug"
                  params={{ userId, courseSlug: course.slug, lessonSlug: lesson.slug }}
                  search={(prev) => ({ tab: 'users' as const, email: prev.email ?? '' })}
                  className={cn('py-4 px-5 flex items-center gap-5', !isLecture && !isCompleted && 'opacity-60')}
                >
                  <div
                    className={cn(
                      'w-[45px] h-[45px] flex items-center justify-center rounded-full border shrink-0',
                      isCompleted ? 'border-success' : 'border-black',
                    )}
                  >
                    {isCompleted ? (
                      <CheckIcon className="[&_path]:fill-success" />
                    ) : (
                      <LessonTypeIcon className="[&_path]:fill-black size-5" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Text variant="main-18" className="text-black">
                      {lesson.title}
                    </Text>
                    <Text variant="main-14" className="text-secondary">
                      {lessonTypeToLabel[lesson.type]}
                    </Text>
                  </div>
                </Link>
              )
            })}
        </Fragment>
      ))}
    </div>
  )
}
