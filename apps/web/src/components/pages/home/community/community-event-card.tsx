import { Link } from '@tanstack/react-router'
import type { CommunityEventListItem } from '@/types/community'
import { Text } from '@/components/ui/text'
import { resolveMediaUrl } from '@/lib/media-url'

function formatEventDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

interface CommunityEventCardProps {
  event: CommunityEventListItem
}

export const CommunityEventCard = ({ event }: CommunityEventCardProps) => {
  const slug = event.slug

  console.log({ event })
  const dateLabel = formatEventDate(event.eventDate)
  const imageSrc = resolveMediaUrl(event.photo?.url)

  const inner = (
    <div className="p-5 flex flex-col gap-5 bg-primary h-full">
      <Text variant={'caps-24'}>{event.title}</Text>
      <Text variant={'main-16'}>{event.description}</Text>
      {dateLabel ? (
        <div className="px-4 py-1 w-fit rounded-[16px] bg-background">
          <Text variant={'caps-12'}>{dateLabel}</Text>
        </div>
      ) : null}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={event.photo?.alt ?? event.title}
          className="w-full rounded-[80px] bg-cover h-[160px] object-cover"
        />
      ) : null}
    </div>
  )

  if (!slug) {
    return inner
  }

  return (
    <Link to="/community/$slug" params={{ slug }} className="block h-full">
      {inner}
    </Link>
  )
}
