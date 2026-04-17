import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageBreadcrumbs } from '@/components/common/breadcrumbs'
import { LessonContentContainer } from '@/components/pages/lesson/lesson-content-container'
import { LessonTitle } from '@/components/pages/lesson/text/lesson-title'
import { getLesson } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'
import { LessonTest } from '@/components/pages/lesson/test/lesson-test'
import { LessonLecture } from '@/components/pages/lesson/lecture/lesson-lecture'
import { LessonCodeChallenge } from '@/components/pages/lesson/code-challenge/lesson-code-challenge'
import { LessonProject } from '@/components/pages/lesson/project/lesson-project'
import { createLessonMeta } from '@/lib/seo'
import { RichText } from '@/components/ui/rich-text'
import { LessonSidebar } from '@/components/pages/lesson/lesson-sidebar/lesson-sidebar'
import { useLessonForUser, CourseLockedError } from '@/hooks/api/lessons/useLessonForUser'
import { CourseLockedModal } from '@/components/pages/lesson/course-locked-modal'

export const Route = createFileRoute('/courses/$courseSlug/$moduleSlug/$lessonSlug')({
  ssr: true,
  loader: async ({ params, context: { queryClient } }) => {
    const lesson = await queryClient.ensureQueryData({
      queryKey: queryKeys.lessons.detail(params.courseSlug, params.lessonSlug),
      queryFn: () => getLesson(params.courseSlug, params.lessonSlug),
      staleTime: 30 * 60 * 1000,
    })
    if (!lesson?.data) throw notFound()
    return {
      lesson: lesson.data,
      courseSlug: params.courseSlug,
      moduleSlug: params.moduleSlug,
      lessonSlug: params.lessonSlug,
    }
  },
  head: ({ loaderData, params }) =>
    createLessonMeta({
      lesson: loaderData!.lesson,
      courseSlug: params.courseSlug,
      moduleSlug: params.moduleSlug,
      lessonSlug: params.lessonSlug,
    }),
  component: LessonPage,
})

function LessonPage() {
  const { lesson, courseSlug, moduleSlug, lessonSlug } = Route.useLoaderData()
  const { error: userLessonError } = useLessonForUser(courseSlug, lessonSlug)
  const isCodingChallenge = lesson.type === 'coding_task'
  const courseLockedError = userLessonError instanceof CourseLockedError ? userLessonError : null

  return (
    <main className="mx-5 mb-[60px] flex min-h-screen min-w-0 flex-col gap-3.5 md:mx-[60px]">
      <PageBreadcrumbs variant="lesson" courseSlug={courseSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
      <div className="flex min-w-0 gap-10">
        <LessonSidebar courseSlug={courseSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
        {isCodingChallenge ? (
          <LessonCodeChallenge
            lesson={lesson}
            courseSlug={courseSlug}
            lessonSlug={lessonSlug}
            moduleSlug={moduleSlug}
          />
        ) : (
          <LessonContentContainer>
            <>
              <LessonTitle title={lesson.title} />
              {lesson.content && <RichText data={lesson.content} className="prose dark:prose-invert max-w-none" />}
            </>

            {lesson.type === 'lecture' && (
              <LessonLecture lesson={lesson} courseSlug={courseSlug} moduleSlug={moduleSlug} />
            )}
            {lesson.type === 'test' && (
              <LessonTest lesson={lesson} courseSlug={courseSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
            )}
            {lesson.type === 'review_task' && (
              <LessonProject lesson={lesson} courseSlug={courseSlug} lessonSlug={lessonSlug} moduleSlug={moduleSlug} />
            )}
          </LessonContentContainer>
        )}
        {courseLockedError && (
          <CourseLockedModal
            courseSlug={courseSlug}
            prerequisiteCourseSlug={courseLockedError.prerequisiteCourseSlug}
            prerequisiteCourseTitle={courseLockedError.prerequisiteCourseTitle}
          />
        )}
      </div>
    </main>
  )
}
