import { Text } from '@/components/ui/text'
import { PageGridBackground } from '@/components/page-section/page-grid-background'
import { PageStatsCards } from '@/components/page-section/page-stats-cards'
import { useProgressCards } from '@/hooks/api/user/useProgressCards'
import { useRating } from '@/hooks/api/user/useRating'
import { useSession } from '@/hooks/useSession'
import { ordinalSuffix } from '@/lib/format-ordinal'
import { PageAvatar } from '@/components/page-section/avatar/page-avatar'
import { RatingTable } from './rating-table'

export const RatingPage = () => {
  const { session } = useSession()
  const { data: progressCards } = useProgressCards()
  const { data: rating = [] } = useRating()

  const isLoggedIn = !!session
  const userName = session?.user?.name ?? session?.user?.email ?? null
  const placeInRanking = isLoggedIn ? (progressCards?.placeInRanking ?? 0) : 0
  const completedLessonsCount = isLoggedIn ? (progressCards?.completedLessonsCount ?? 0) : 0

  const headline = userName ? `WELL DONE ${userName.toUpperCase()}!` : 'JOIN TO TRACK YOUR RANKING!'

  return (
    <main className="flex flex-col min-h-screen">
      <PageGridBackground>
        <div className="flex max-xl:flex-col xl:flex-row xl:items-start xl:justify-between gap-2 pt-9 xl:gap-10">
          <PageAvatar message={headline} />
          <PageStatsCards
            items={[
              {
                firstNum: placeInRanking ? placeInRanking.toString() : '-',
                secondNum: placeInRanking ? ordinalSuffix(placeInRanking) : undefined,
                text: 'PLACE IN RANKING',
                className: 'xl:border-r max-xl:border-r border-border',
              },
              {
                firstNum: completedLessonsCount ? completedLessonsCount.toString() : '-',
                text: 'LESSONS COMPLETED',
              },
            ]}
          />
        </div>
      </PageGridBackground>

      <div className="bg-header px-6 py-14 md:px-10 md:py-[60px] xl:px-[60px] text-[#e0deda] flex flex-col gap-10">
        <Text variant="subtitle-32">_TOTAL RATING</Text>

        <RatingTable rating={rating} currentUserId={session?.user?.id} />
      </div>
    </main>
  )
}
