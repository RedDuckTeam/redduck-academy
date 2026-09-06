import { createFileRoute } from '@tanstack/react-router'
import { LessonEditor } from '@/components/editor/lesson-editor'
import { createPageMeta } from '@/lib/seo'

export const Route = createFileRoute('/edit/$courseSlug/$moduleSlug/$lessonSlug')({
  // Client-only. The editor is built on the clipboard, IndexedDB and `crypto.subtle`, none of which
  // the Worker has, and rendering it server-side would drag CodeMirror into the SSR bundle for a
  // screen nobody should be reading without JavaScript.
  ssr: false,
  head: () => {
    const meta = createPageMeta({
      title: 'Improve this lesson',
      description: 'Edit a lesson and open it as a pull request on the RedDuck Academy content repository.',
    })
    // A per-lesson editor duplicates the lesson's own prose; it should never compete with it in
    // search results.
    return { ...meta, meta: [...(meta.meta ?? []), { name: 'robots', content: 'noindex' }] }
  },
  component: EditLessonPage,
})

function EditLessonPage() {
  const { courseSlug, moduleSlug, lessonSlug } = Route.useParams()
  return <LessonEditor key={lessonSlug} courseSlug={courseSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
}
