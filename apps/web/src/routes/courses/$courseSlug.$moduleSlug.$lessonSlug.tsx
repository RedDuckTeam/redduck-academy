import { createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { PageBreadcrumbs } from '@/components/common/breadcrumbs'
import { LessonContentContainer } from '@/components/pages/lesson/lesson-content-container'
import { LessonTitle } from '@/components/pages/lesson/text/lesson-title'
import { getCourse, getLesson } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'
import { LessonTest } from '@/components/pages/lesson/test/lesson-test'
import { LessonLecture } from '@/components/pages/lesson/lecture/lesson-lecture'
import { LessonCodeChallenge } from '@/components/pages/lesson/code-challenge/lesson-code-challenge'
import { LessonProject } from '@/components/pages/lesson/project/lesson-project'
import { createLessonMeta } from '@/lib/seo'
import { RichText } from '@/components/ui/rich-text'
import { LessonSidebar } from '@/components/pages/lesson/lesson-sidebar/lesson-sidebar'
import { LessonToc, MobileToc } from '@/components/pages/lesson/toc'
import { useLessonForUser, CourseLockedError } from '@/hooks/api/lessons/useLessonForUser'
import { CourseLockedModal } from '@/components/pages/lesson/course-locked-modal'
import { useLessonCompletionToast } from '@/hooks/useLessonCompletionToast'

export const Route = createFileRoute('/courses/$courseSlug/$moduleSlug/$lessonSlug')({
  ssr: true,
  loader: async ({ params, context: { queryClient } }) => {
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
  const { lesson, courseTitle, courseSlug, moduleSlug, lessonSlug } = Route.useLoaderData()
  const { error: userLessonError } = useLessonForUser(courseSlug, lessonSlug)
  useLessonCompletionToast({ courseSlug, lessonSlug, lessonTitle: lesson.title })
  const isCodingChallenge = lesson.type === 'coding_task'
  const courseLockedError = userLessonError instanceof CourseLockedError ? userLessonError : null

  const mainRef = useRef<HTMLElement>(null)
  const [mainHeight, setMainHeight] = useState<number | null>(null)

  useEffect(() => {
    if (!isCodingChallenge) {
      setMainHeight(null)
      document.body.style.overflow = ''
      return
    }

    const measure = () => {
      if (!mainRef.current || window.innerWidth < 1280) {
        setMainHeight(null)
        document.body.style.overflow = ''
        return
      }
      const top = mainRef.current.getBoundingClientRect().top + window.scrollY
      setMainHeight(window.innerHeight - top - 10)
      document.body.style.overflow = 'hidden'
    }

    measure()
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      document.body.style.overflow = ''
    }
  }, [isCodingChallenge])

  return (
    <main
      ref={mainRef}
      className={cn(
        'mx-5 flex min-w-0 flex-col gap-3.5 lg:mx-[60px]',
        isCodingChallenge ? 'mb-5 md:mb-[60px]' : 'mb-[60px] min-h-screen',
      )}
      style={mainHeight ? { height: mainHeight } : undefined}
    >
      {!isCodingChallenge && <MobileToc lesson={lesson} />}
      <PageBreadcrumbs
        variant="lesson"
        courseSlug={courseSlug}
        courseTitle={courseTitle}
        moduleSlug={moduleSlug}
        lessonSlug={lessonSlug}
      />
      <div className={cn('flex min-w-0 gap-10', isCodingChallenge && 'xl:flex-1 xl:min-h-0 ')}>
        <LessonSidebar courseSlug={courseSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
        {isCodingChallenge ? (
          <LessonCodeChallenge
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
              {lesson.type === 'test' && (
                <LessonTest lesson={lesson} courseSlug={courseSlug} lessonSlug={lessonSlug} />
              )}
              {lesson.type === 'review_task' && (
                <LessonProject lesson={lesson} courseSlug={courseSlug} lessonSlug={lessonSlug} moduleSlug={moduleSlug} />
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
    </main>
  )
}
