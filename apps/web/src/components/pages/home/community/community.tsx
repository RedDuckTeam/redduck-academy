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
    <div className="flex flex-col gap-5 sm:gap-10 px-6 py-14 md:px-10 md:py-[60px] xl:px-[60px]">
      <Text variant={'subtitle-32'}>_COMMUNITY</Text>
      <Carousel opts={{ align: 'start', loop: false }} className="w-full">
        <CarouselContent className="-ml-5">
          {events.map((event, index) => (
            <CarouselItem key={event.id} className="pl-5 basis-[90%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <CommunityEventCard event={event} index={index} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
