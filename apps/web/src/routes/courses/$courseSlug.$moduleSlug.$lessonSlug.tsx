import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { FilePenLine } from 'lucide-react'
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
import {
  absoluteUrl,
  buildBreadcrumbLd,
  buildLessonFaqLd,
  buildLessonLd,
  createDefaultMeta,
  createLessonMeta,
} from '@/lib/seo'
import { JsonLd } from '@/components/seo/json-ld'
import { RichText } from '@/components/content/rich-text'
import { MarkdownContent } from '@/components/content/markdown-content'
import { lessonProseClass } from '@/components/content/rich-content-styles'
import { loadLessonContent } from '@/lib/content/lesson-body'
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
      // Content assets are immutable per deploy, so cache them for the session
      // (staleTime Infinity) — this stops the manifest and body being refetched on every
      // navigation. The lesson's faq rides along with its body from the one `.md` fetch.
      const [lesson, course, content] = await Promise.all([
        queryClient.ensureQueryData({
          queryKey: queryKeys.lessons.detail(params.courseSlug, params.lessonSlug),
          queryFn: () => getLesson(params.courseSlug, params.lessonSlug),
          staleTime: Infinity,
        }),
        queryClient.ensureQueryData({
          queryKey: queryKeys.courses.detail(params.courseSlug),
          queryFn: () => getCourse(params.courseSlug),
          staleTime: Infinity,
        }),
        queryClient.ensureQueryData({
          queryKey: queryKeys.lessons.body(params.courseSlug, params.moduleSlug, params.lessonSlug),
          queryFn: () => loadLessonContent(params.courseSlug, params.moduleSlug, params.lessonSlug),
          staleTime: Infinity,
        }),
      ])
      if (!lesson?.data || !course?.data) throw notFound()
      return {
        lesson: lesson.data,
        courseTitle: course.data.title,
        courseSlug: params.courseSlug,
        moduleSlug: params.moduleSlug,
        lessonSlug: params.lessonSlug,
        lessonBody: content?.body ?? null,
        lessonFaq: content?.faq ?? null,
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
      markdownBody: loaderData.lessonBody,
    })
  },
  component: LessonPage,
  notFoundComponent: LessonNotFound,
})

function LessonNotFound() {
  const { courseSlug } = Route.useParams()
  return <LessonNotFoundPage courseSlug={courseSlug} />
}

interface SuggestEditLinkProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
}

/**
 * Deliberately shown to logged-out visitors too: nothing before the final hand-off to GitHub needs
 * an account of any kind. "Suggest" rather than "Edit" because the change goes to review, and
 * because on a site with accounts and an admin panel "Edit" reads as staff-only. Kept quiet on
 * purpose — it sits beside the lesson title, where anything louder would compete with the heading.
 */
function SuggestEditLink({ courseSlug, moduleSlug, lessonSlug }: SuggestEditLinkProps) {
  return (
    <Link
      to="/edit/$courseSlug/$moduleSlug/$lessonSlug"
      params={{ courseSlug, moduleSlug, lessonSlug }}
      title="Edit this lesson’s Markdown and open it as a pull request"
      className="text-muted-foreground hover:text-foreground focus-visible:text-foreground inline-flex shrink-0 items-center gap-1.5 text-xs whitespace-nowrap underline-offset-4 transition-colors hover:underline"
    >
      <FilePenLine className="size-3.5" aria-hidden />
      Suggest an edit
    </Link>
  )
}

function LessonPage() {
  const { lesson, courseTitle, courseSlug, moduleSlug, lessonSlug, lessonBody, lessonFaq } = Route.useLoaderData()
  // Prose is served from the open-source content/ files (static assets, resolved in the
  // loader); fall back to the DB Lexical only if no file exists (e.g. a row not yet dumped).
  const { error: userLessonError } = useLessonForUser(courseSlug, lessonSlug)
  useLessonCompletionToast({ courseSlug, lessonSlug, lessonTitle: lesson.title })
  const isCodingChallenge = lesson.type === 'coding_task'
  const courseLockedError = userLessonError instanceof CourseLockedError ? userLessonError : null
  const faqLd = buildLessonFaqLd(lessonFaq)

  useScrollMagnet({ enabled: isCodingChallenge, targetId: 'coding-task-row', offset: 20, range: 40 })

  return (
    <main
      className={cn('mx-5 flex min-w-0 flex-col gap-3.5 lg:mx-[60px] mb-[60px]', !isCodingChallenge && 'min-h-screen')}
    >
      <JsonLd
        data={[
          buildLessonLd({ lesson, courseTitle, courseSlug, moduleSlug, lessonSlug, markdownBody: lessonBody }),
          ...(faqLd ? [faqLd] : []),
          buildBreadcrumbLd([
            { name: courseTitle, url: absoluteUrl(`/courses/${courseSlug}`) },
            { name: lesson.title, url: absoluteUrl(`/courses/${courseSlug}/${moduleSlug}/${lessonSlug}`) },
          ]),
        ]}
      />
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
                {/* w-full because the article is a flex column with items-start, which would otherwise
                    shrink this row to its content and leave justify-between nothing to space. */}
                <div className="flex w-full flex-wrap items-center justify-between gap-3">
                  <LessonTitle title={lesson.title} />
                  {/* Hidden when the prose comes from the DB, because then there is no file to
                      propose against. */}
                  {/* Not offered for tests: their questions live below the prose in a grammar the
                      editor does not yet understand, and a wrong edit there deletes learners' saved
                      answers on the next content sync. */}
                  {lessonBody != null && lesson.type !== 'test' && (
                    <SuggestEditLink courseSlug={courseSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
                  )}
                </div>
                {lessonBody != null ? (
                  <>
                    <MarkdownContent source={lessonBody} className={lessonProseClass} />
                  </>
                ) : lesson.content ? (
                  <RichText data={lesson.content} className={lessonProseClass} />
                ) : null}
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
