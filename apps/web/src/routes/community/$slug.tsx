import { createFileRoute, notFound } from '@tanstack/react-router'
import { LessonTitle } from '@/components/pages/lesson/text/lesson-title'
import { getCommunityEvent } from '@/lib/api/community'
import { createCommunityEventMeta } from '@/lib/seo'
import { RichText } from '@/components/ui/rich-text'
import { resolveMediaUrl } from '@/lib/media-url'

export const Route = createFileRoute('/community/$slug')({
  ssr: true,
  loader: async ({ params }) => {
    const res = await getCommunityEvent(params.slug)
    if (!res?.data) throw notFound()
    return { event: res.data, slug: params.slug }
  },
  head: ({ loaderData, params }) =>
    createCommunityEventMeta({ event: loaderData!.event, slug: params.slug }),
  component: CommunityEventPage,
})

function CommunityEventPage() {
  const { event } = Route.useLoaderData()
  const imageSrc = resolveMediaUrl(event.photo?.url)

  return (
    <main className="flex flex-col min-h-screen gap-3.5 mx-[60px] mb-[60px]">
      <div className="flex flex-col gap-6 max-w-4xl">
        <LessonTitle title={event.title} />
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={event.photo?.alt ?? event.title}
            className="w-full max-h-[400px] rounded-[40px] object-cover"
          />
        ) : null}
        {event.content ? (
          <RichText data={event.content} className="prose dark:prose-invert max-w-none" />
        ) : null}
      </div>
    </main>
  )
}
