import { Link } from '@tanstack/react-router'
import { Fragment } from 'react/jsx-runtime'
import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { lessonTypeToLabel } from '@/lib/lessons/lessons'
import { PlayIcon } from '@/components/ui/icons/play'
import { cn } from '@/lib/utils'
import { CheckIcon } from '@/components/ui/icons/check'

interface CoursesListProps {
  courses: Course[]
  courseSlug: string
  completedLessons: Set<number>
}

export const CoursesList = ({ courses, courseSlug, completedLessons }: CoursesListProps) => {
  if (!courses.length) return null
  const course = courses.find((c) => c.slug === courseSlug) ?? courses[0]
  return (
    <div className="flex flex-col border border-border divide-y divide-border">
      {course.modules.map((module, index) => (
        <Fragment key={module.slug}>
          <div className="p-5">
            <Text variant="caps-20" className="text-black">
              {index < 10 ? `0${index + 1}` : index + 1}. {module.title}
            </Text>
          </div>
          {module.lessons
            .sort((a, b) => a.order - b.order)
            .map((lesson) => {
              const isCompleted = completedLessons.has(lesson.id)
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
                  <div
                    className={cn(
                      'w-[45px] h-[45px] flex items-center justify-center rounded-full border ',
                      isCompleted ? 'border-success' : 'border-black',
                    )}
                  >
                    {isCompleted ? (
                      <CheckIcon className="[&_path]:fill-success" />
                    ) : (
                      <PlayIcon className="translate-x-0.5 [&_path]:fill-black" />
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
