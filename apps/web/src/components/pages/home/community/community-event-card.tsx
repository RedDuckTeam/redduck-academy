import { Link } from '@tanstack/react-router'
import type { CommunityEventListItem } from '@/types/community'
import { Text } from '@/components/ui/text'
import { resolveMediaUrl } from '@/lib/media-url'
import { formatLongDate } from '@/lib/format-date'
import { pickCardColor } from '@/lib/theme-colors'
import { cn } from '@/lib/utils'

interface CommunityEventCardProps {
  event: CommunityEventListItem
  index: number
}

export const CommunityEventCard = ({ event, index }: CommunityEventCardProps) => {
  const slug = event.slug

  const dateLabel = formatLongDate(event.eventDate)
  const imageSrc = resolveMediaUrl(event.photo?.url)

  const cardColorClass = pickCardColor(index)

  const inner = (
    <div className={cn('p-5 flex flex-col gap-5 h-full transition-colors', cardColorClass)}>
      <Text variant={'caps-24'}>{event.title}</Text>
      <Text variant={'main-16'}>{event.description}</Text>
      {dateLabel ? (
        <div className="px-4 py-1 w-fit rounded-[16px] bg-background transition-colors">
          <Text variant={'caps-12'}>{dateLabel}</Text>
        </div>
      ) : null}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={event.photo?.alt ?? event.title}
          className="w-full rounded-[80px] h-[160px] object-cover object-center"
        />
      ) : null}
    </div>
  )

  if (!slug) {
    return inner
  }

  return (
    <Link to="/community/$slug" params={{ slug }} className="block h-full transition-colors">
      {inner}
    </Link>
  )
}
