import { Link } from '@tanstack/react-router'
import { Text } from '@/components/ui/text'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useAdminLessonsTree } from '@/hooks/api/admin/useAdminLessonsTree'
import type { AdminLessonTreeLesson } from '@/lib/api/admin'

function LessonStats({ lesson }: { lesson: AdminLessonTreeLesson }) {
  if (lesson.type === 'coding_task' || lesson.type === 'review_task') {
    return (
      <Text variant="caps-14" className="text-muted-foreground whitespace-nowrap">
        {lesson.successAttempts} / {lesson.totalAttempts} PASSED · {lesson.completedCount} COMPLETED
      </Text>
    )
  }
  return (
    <Text variant="caps-14" className="text-muted-foreground whitespace-nowrap">
      {lesson.completedCount} COMPLETED
    </Text>
  )
}

function LessonTypeBadge({ type }: { type: AdminLessonTreeLesson['type'] }) {
  const label =
    type === 'review_task'
      ? 'PROJECT'
      : type === 'coding_task'
        ? 'CODING'
        : type === 'test'
          ? 'TEST'
          : 'LECTURE'
  return (
    <Text variant="caps-14" className="text-border whitespace-nowrap">
      {label}
    </Text>
  )
}

export function AdminLessonsTab() {
  const { data, isPending, isError, error } = useAdminLessonsTree()

  if (isPending) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-20" className="text-muted-foreground">
          LOADING…
        </Text>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-20" className="text-muted-foreground">
          {error?.message?.toUpperCase() ?? 'FAILED TO LOAD LESSONS'}
        </Text>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-14" className="text-muted-foreground">
          NO COURSES FOUND
        </Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Accordion type="multiple" className="flex flex-col gap-4">
        {data.map((course) => (
          <AccordionItem
            key={course.id}
            value={`course-${course.id}`}
            className="border border-border"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline">
              <Text variant="caps-20">{course.title.toUpperCase()}</Text>
            </AccordionTrigger>
            <AccordionContent className="border-t border-border px-0 pb-0">
              <Accordion type="multiple" className="flex flex-col">
                {(course.modules ?? []).map((mod) => (
                  <AccordionItem
                    key={mod.id}
                    value={`module-${mod.id}`}
                    className="border-b border-border last:border-b-0"
                  >
                    <AccordionTrigger className="px-5 py-3 hover:no-underline">
                      <Text variant="caps-14">{mod.title.toUpperCase()}</Text>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <ul className="flex flex-col">
                        {(mod.lessons ?? []).map((lesson) => (
                          <li
                            key={lesson.id}
                            className="border-t border-border first:border-t-0"
                          >
                            <Link
                              to="/admin/lessons/$courseSlug/$lessonSlug"
                              params={{
                                courseSlug: course.slug,
                                lessonSlug: lesson.slug,
                              }}
                              search={{ tab: 'lessons' as const }}
                              className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors"
                            >
                              <div className="flex-1 min-w-0 flex items-center gap-3">
                                <LessonTypeBadge type={lesson.type} />
                                <Text variant="caps-14" className="truncate">
                                  {lesson.title.toUpperCase()}
                                </Text>
                              </div>
                              <LessonStats lesson={lesson} />
                            </Link>
                          </li>
                        ))}
                        {(mod.lessons ?? []).length === 0 && (
                          <li className="px-5 py-3 border-t border-border">
                            <Text variant="caps-14" className="text-muted-foreground">
                              NO LESSONS
                            </Text>
                          </li>
                        )}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
                {(course.modules ?? []).length === 0 && (
                  <div className="px-5 py-3 border-t border-border">
                    <Text variant="caps-14" className="text-muted-foreground">
                      NO MODULES
                    </Text>
                  </div>
                )}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
