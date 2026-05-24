import { Link } from '@tanstack/react-router'
import { Fragment } from 'react/jsx-runtime'
import type { Course } from '@/types/lesson'
import { LessonTypeEnum } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { lessonTypeToIcon, lessonTypeToLabel } from '@/lib/lessons/lessons'
import { padIndex } from '@/lib/format-index'
import type { AdminLessonTreeLesson } from '@/lib/api/admin'

interface AdminLessonsListProps {
  courses: Course[]
  courseSlug: string
  /** Aggregate submission stats per lesson id, sourced from the admin lessons tree. */
  statsByLessonId: Map<number, AdminLessonTreeLesson>
}

function LessonStats({ stats }: { stats?: AdminLessonTreeLesson }) {
  const completed = stats?.completedCount ?? 0
  if (stats && (stats.type === LessonTypeEnum.CODING_TASK || stats.type === LessonTypeEnum.REVIEW_TASK)) {
    return (
      <Text variant="caps-14" className="text-secondary whitespace-nowrap">
        {stats.successAttempts} / {stats.totalAttempts} PASSED · {completed} COMPLETED
      </Text>
    )
  }
  return (
    <Text variant="caps-14" className="text-secondary whitespace-nowrap">
      {completed} COMPLETED
    </Text>
  )
}

export const AdminLessonsList = ({ courses, courseSlug, statsByLessonId }: AdminLessonsListProps) => {
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
              const LessonTypeIcon = lessonTypeToIcon[lesson.type]
              return (
                <Link
                  key={lesson.slug}
                  to="/admin/lessons/$courseSlug/$lessonSlug"
                  params={{ courseSlug: course.slug, lessonSlug: lesson.slug }}
                  search={{ tab: 'lessons' as const }}
                  className="py-4 px-5 flex items-center gap-5 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-[45px] h-[45px] flex items-center justify-center rounded-full border border-black shrink-0">
                    <LessonTypeIcon className="[&_path]:fill-black size-5" />
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <Text variant="main-18" className="text-black truncate">
                      {lesson.title}
                    </Text>
                    <Text variant="main-14" className="text-secondary">
                      {lessonTypeToLabel[lesson.type]}
                    </Text>
                  </div>
                  <LessonStats stats={statsByLessonId.get(lesson.id)} />
                </Link>
              )
            })}
        </Fragment>
      ))}
    </div>
  )
}
