import { Text } from '@/components/ui/text'

export const CommunityEventCard = () => {
  return (
    <div className="p-5 flex flex-col gap-5 bg-primary">
      <Text variant={'caps-24'}>Future events</Text>
      <Text variant={'main-16'}>
        Lorem ipsum dolor sit amet consectetur. Eget elit morbi volutpat mollis cursus egestas amet placerat urna.
        Commodo{' '}
      </Text>
      <div className="px-4 py-1 w-fit rounded-[16px] bg-background">
        <Text variant={'caps-12'}>March 15, 2026</Text>
      </div>
      <img
        src="src/assets/svg/community-event-card.svg"
        alt="Community Event Card"
        className="w-full rounded-[80px] bg-cover h-[160px]"
      />
    </div>
  )
}
