import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageBreadcrumbs } from '@/components/common/breadcrumbs'
import { LessonTitle } from '@/components/pages/lesson/text/lesson-title'
import { getCommunityEvent } from '@/lib/api/community'
import { queryKeys } from '@/lib/query-keys'
import { createCommunityEventMeta } from '@/lib/seo'
import { RichText } from '@/components/ui/rich-text'
import { LessonContentContainer } from '@/components/pages/lesson/lesson-content-container'

export const Route = createFileRoute('/community/$slug')({
  ssr: true,
  loader: async ({ params, context: { queryClient } }) => {
    const res = await queryClient.ensureQueryData({
      queryKey: queryKeys.community.detail(params.slug),
      queryFn: () => getCommunityEvent(params.slug),
      staleTime: 10 * 60 * 1000,
    })
    if (!res?.data) throw notFound()
    return { event: res.data, slug: params.slug }
  },
  head: ({ loaderData, params }) => createCommunityEventMeta({ event: loaderData!.event, slug: params.slug }),
  component: CommunityEventPage,
})

function CommunityEventPage() {
  const { event } = Route.useLoaderData()

  return (
    <main className="flex flex-col min-h-screen gap-3.5 mx-[60px] mb-[60px]">
      <PageBreadcrumbs variant="community" eventTitle={event.title} />
      <LessonContentContainer>
        <LessonTitle title={event.title} />

        {event.content ? <RichText data={event.content} className="prose dark:prose-invert max-w-none" /> : null}
      </LessonContentContainer>
    </main>
  )
}
