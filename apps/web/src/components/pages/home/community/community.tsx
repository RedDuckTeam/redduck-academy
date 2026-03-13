import { CommunityEventCard } from './community-event-card'
import { Text } from '@/components/ui/text'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

export const Community = () => {
  return (
    <div className="p-[60px] flex flex-col gap-10">
      <Text variant={'subtitle-32'}>_COMMUNITY</Text>
      <Carousel opts={{ align: 'start', loop: false }} className="w-full">
        <CarouselContent className="-ml-5">
          <CarouselItem className="pl-5 basis-full sm:basis-1/2 lg:basis-1/3">
            <CommunityEventCard />
          </CarouselItem>
          <CarouselItem className="pl-5 basis-full sm:basis-1/2 lg:basis-1/3">
            <CommunityEventCard />
          </CarouselItem>
          <CarouselItem className="pl-5 basis-full sm:basis-1/2 lg:basis-1/3">
            <CommunityEventCard />
          </CarouselItem>
          <CarouselItem className="pl-5 basis-full sm:basis-1/2 lg:basis-1/3">
            <CommunityEventCard />
          </CarouselItem>
          <CarouselItem className="pl-5 basis-full sm:basis-1/2 lg:basis-1/3">
            <CommunityEventCard />
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </div>
  )
}
