import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageBreadcrumbs } from '@/components/common/breadcrumbs'
import { LessonContentContainer } from '@/components/pages/lesson/lesson-content-container'
import { LessonTitle } from '@/components/pages/lesson/text/lesson-title'
import { getLesson } from '@/lib/api/courses'
import { RichText } from '@/components/ui/rich-text'
import { LessonTest } from '@/components/pages/lesson/test/lesson-test'

export const Route = createFileRoute(
  '/courses/$courseSlug/$moduleSlug/$lessonSlug',
)({
  ssr: true,
  loader: async ({ params }) => {
    const lesson = await getLesson(params.courseSlug, params.lessonSlug)
    if (!lesson) throw notFound()
    return {
      lesson: lesson.data,
      courseSlug: params.courseSlug,
      moduleSlug: params.moduleSlug,
      lessonSlug: params.lessonSlug,
    }
  },
  component: LessonPage,
})

function LessonPage() {
  const { lesson, courseSlug, moduleSlug, lessonSlug } = Route.useLoaderData()

  return (
    <main className="flex flex-col min-h-screen gap-3.5 mx-[60px]">
      <PageBreadcrumbs
        courseSlug={courseSlug}
        moduleSlug={moduleSlug}
        lessonSlug={lessonSlug}
      />
      <LessonContentContainer>
        <LessonTitle title={lesson.title} />
        {lesson.type === 'lecture' && lesson.content && (
          <RichText
            data={lesson.content}
            className="prose dark:prose-invert max-w-none"
          />
        )}
        {lesson.type === 'test' && <LessonTest lesson={lesson} />}
      </LessonContentContainer>
    </main>
  )
}
