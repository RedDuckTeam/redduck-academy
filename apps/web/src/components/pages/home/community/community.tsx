import { CommunityEventCard } from './community-event-card'
import type { CommunityEventListItem } from '@/types/community'
import { Text } from '@/components/ui/text'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'

interface CommunitySectionProps {
  events: CommunityEventListItem[]
}

export const Community = ({ events }: CommunitySectionProps) => {
  if (events.length === 0) {
    return null
  }

  return (
    <div className="p-[60px] flex flex-col gap-10">
      <Text variant={'subtitle-32'}>_COMMUNITY</Text>
      <Carousel opts={{ align: 'start', loop: false }} className="w-full">
        <CarouselContent className="-ml-5">
          {events.map((event) => (
            <CarouselItem key={event.id} className="pl-5 basis-full sm:basis-1/2 lg:basis-1/3">
              <CommunityEventCard event={event} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
