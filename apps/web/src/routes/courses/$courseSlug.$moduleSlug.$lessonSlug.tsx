import { createFileRoute, notFound } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useScrollMagnet } from '@/hooks/useScrollMagnet'
import { PageBreadcrumbs } from '@/components/common/breadcrumbs'
import { LessonNotFoundPage } from '@/components/pages/not-found/lesson-not-found-page'
import { LessonContentContainer } from '@/components/pages/lesson/lesson-content-container'
import { LessonTitle } from '@/components/pages/lesson/text/lesson-title'
import { getCourse, getLesson } from '@/lib/api/courses'
import { ApiError } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query-keys'
import { LessonTest } from '@/components/pages/lesson/test/lesson-test'
import { LessonLecture } from '@/components/pages/lesson/lecture/lesson-lecture'
import { LessonCodeChallenge } from '@/components/pages/lesson/code-challenge/lesson-code-challenge'
import { LessonNavigation } from '@/components/pages/lesson/lesson-navigation/lesson-navigation'
import { LessonProject } from '@/components/pages/lesson/project/lesson-project'
import { createDefaultMeta, createLessonMeta } from '@/lib/seo'
import { RichText } from '@/components/ui/rich-text'
import { LessonSidebar } from '@/components/pages/lesson/lesson-sidebar/lesson-sidebar'
import { LessonToc, MobileToc } from '@/components/pages/lesson/toc'
import { useLessonForUser, CourseLockedError } from '@/hooks/api/lessons/useLessonForUser'
import { CourseLockedModal } from '@/components/pages/lesson/course-locked-modal'
import { useLessonCompletionToast } from '@/hooks/useLessonCompletionToast'

export const Route = createFileRoute('/courses/$courseSlug/$moduleSlug/$lessonSlug')({
  ssr: true,
  // `pendingNext` is set when a learner returns here from sign-in after clicking
  // "Next" on a lecture — it tells the page to finish the lesson and advance.
  validateSearch: (search: Record<string, unknown>): { pendingNext?: boolean } => {
    const v = search.pendingNext
    return v === true || v === 1 || v === '1' || v === 'true' ? { pendingNext: true } : {}
  },
  loader: async ({ params, context: { queryClient } }) => {
    try {
      const [lesson, course] = await Promise.all([
        queryClient.ensureQueryData({
          queryKey: queryKeys.lessons.detail(params.courseSlug, params.lessonSlug),
          queryFn: () => getLesson(params.courseSlug, params.lessonSlug),
          staleTime: 30 * 60 * 1000,
        }),
        queryClient.ensureQueryData({
          queryKey: queryKeys.courses.detail(params.courseSlug),
          queryFn: () => getCourse(params.courseSlug),
          staleTime: 30 * 60 * 1000,
        }),
      ])
      if (!lesson?.data || !course?.data) throw notFound()
      return {
        lesson: lesson.data,
        courseTitle: course.data.title,
        courseSlug: params.courseSlug,
        moduleSlug: params.moduleSlug,
        lessonSlug: params.lessonSlug,
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) throw notFound()
      throw err
    }
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return createDefaultMeta()
    return createLessonMeta({
      lesson: loaderData.lesson,
      courseSlug: params.courseSlug,
      moduleSlug: params.moduleSlug,
      lessonSlug: params.lessonSlug,
    })
  },
  component: LessonPage,
  notFoundComponent: LessonNotFound,
})

function LessonNotFound() {
  const { courseSlug } = Route.useParams()
  return <LessonNotFoundPage courseSlug={courseSlug} />
}

function LessonPage() {
  const { lesson, courseTitle, courseSlug, moduleSlug, lessonSlug } = Route.useLoaderData()
  const { error: userLessonError } = useLessonForUser(courseSlug, lessonSlug)
  useLessonCompletionToast({ courseSlug, lessonSlug, lessonTitle: lesson.title })
  const isCodingChallenge = lesson.type === 'coding_task'
  const courseLockedError = userLessonError instanceof CourseLockedError ? userLessonError : null

  useScrollMagnet({ enabled: isCodingChallenge, targetId: 'coding-task-row', offset: 20, range: 40 })

  return (
    <main
      className={cn('mx-5 flex min-w-0 flex-col gap-3.5 lg:mx-[60px] mb-[60px]', !isCodingChallenge && 'min-h-screen')}
    >
      {!isCodingChallenge && <MobileToc lesson={lesson} />}
      <PageBreadcrumbs
        variant="lesson"
        courseSlug={courseSlug}
        courseTitle={courseTitle}
        moduleSlug={moduleSlug}
        lessonSlug={lessonSlug}
        lessonTitle={lesson.title}
      />
      <div
        id={isCodingChallenge ? 'coding-task-row' : undefined}
        className={cn(
          'flex min-w-0 gap-10',
          // Coding challenge: lock the row to (almost) full viewport so editor + description
          // get real estate even on laptops. Page scrolls to bring this into focus.
          isCodingChallenge && 'xl:h-[calc(100vh-2.5rem)]',
        )}
      >
        <LessonSidebar courseSlug={courseSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
        {isCodingChallenge ? (
          <LessonCodeChallenge
            key={lessonSlug}
            lesson={lesson}
            courseSlug={courseSlug}
            lessonSlug={lessonSlug}
            moduleSlug={moduleSlug}
          />
        ) : (
          <>
            <LessonContentContainer>
              <>
                <LessonTitle title={lesson.title} />
                {lesson.content && (
                  <RichText data={lesson.content} className="prose dark:prose-invert max-w-none w-full" />
                )}
              </>

              {lesson.type === 'lecture' && <LessonLecture lesson={lesson} courseSlug={courseSlug} />}
              {lesson.type === 'test' && <LessonTest lesson={lesson} courseSlug={courseSlug} lessonSlug={lessonSlug} />}
              {lesson.type === 'review_task' && (
                <LessonProject
                  lesson={lesson}
                  courseSlug={courseSlug}
                  lessonSlug={lessonSlug}
                  moduleSlug={moduleSlug}
                />
              )}
            </LessonContentContainer>
            <LessonToc lesson={lesson} />
          </>
        )}
        {courseLockedError && (
          <CourseLockedModal
            courseSlug={courseSlug}
            prerequisiteCourseSlug={courseLockedError.prerequisiteCourseSlug}
            prerequisiteCourseTitle={courseLockedError.prerequisiteCourseTitle}
          />
        )}
      </div>
      {isCodingChallenge && (
        <div className="mx-auto w-full max-w-[1100px] mt-10">
          <LessonNavigation courseSlug={courseSlug} lesson={lesson} />
        </div>
      )}
    </main>
  )
}
