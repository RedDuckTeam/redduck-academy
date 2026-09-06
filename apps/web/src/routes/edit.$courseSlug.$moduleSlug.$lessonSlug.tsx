import { createFileRoute } from '@tanstack/react-router'
import { LessonEditor } from '@/components/pages/editor/lesson-editor'
import { createPageMeta } from '@/lib/seo'

export const Route = createFileRoute('/edit/$courseSlug/$moduleSlug/$lessonSlug')({
  // The clipboard, sessionStorage and `matchMedia` do not exist in the Worker.
  ssr: false,
  head: () => {
    const meta = createPageMeta({
      title: 'Improve this lesson',
      description: 'Edit a lesson and open it as a pull request on the RedDuck Academy content repository.',
    })
    // The editor duplicates the lesson's prose and must not compete with it in search results.
    return { ...meta, meta: [...(meta.meta ?? []), { name: 'robots', content: 'noindex' }] }
  },
  component: EditLessonPage,
})

function EditLessonPage() {
  const { courseSlug, moduleSlug, lessonSlug } = Route.useParams()
  return <LessonEditor key={lessonSlug} courseSlug={courseSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
}
