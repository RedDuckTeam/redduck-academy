import { Text } from '@/components/ui/text'
import { PageGridBackground } from '@/components/page-section/page-grid-background'
import { PageStatsCards } from '@/components/page-section/page-stats-cards'
import { useProgressCards } from '@/hooks/api/user/useProgressCards'
import { useRating } from '@/hooks/api/user/useRating'
import { useSession } from '@/hooks/useSession'
import { ordinalSuffix } from '@/lib/format-ordinal'
import { cn } from '@/lib/utils'
import { PageAvatar } from '@/components/page-section/avatar/page-avatar'

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
        <div className="flex max-xl:flex-col xl:flex-row xl:items-start xl:justify-between gap-6 pt-9 xl:gap-10">
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
                text: 'LESSONS PASSED',
              },
            ]}
          />
        </div>
      </PageGridBackground>

      <div className="bg-header px-6 py-14 md:px-10 md:py-[60px] xl:px-[60px] text-[#e0deda] flex flex-col gap-10">
        <Text variant="subtitle-32">_TOTAL RATING</Text>

        <div className="border border-border">
          <div className="grid grid-cols-[120px_1fr_130px_130px] border-b border-border">
            <div className="p-5">
              <Text variant="caps-20">RATING</Text>
            </div>
            <div className="p-5">
              <Text variant="caps-20">STUDENT</Text>
            </div>
            <div className="p-5 text-center">
              <Text variant="caps-20">COURSES</Text>
            </div>
            <div className="p-5 text-center">
              <Text variant="caps-20">LESSONS</Text>
            </div>
          </div>

          {rating.map((entry) => {
            const isCurrentUser = entry.userId === session?.user?.id
            return (
              <div
                key={entry.userId}
                className={cn(
                  'grid grid-cols-[120px_1fr_130px_130px] border-b border-border divide-x divide-border last:border-b-0',
                )}
              >
                <div className="p-5">
                  <Text variant="caps-20" className="text-primary">
                    {String(entry.rank).padStart(2, '0')}.
                  </Text>
                </div>
                <div className={cn('p-5', isCurrentUser && 'text-primary')}>
                  <Text variant="caps-20">{entry.userName?.toUpperCase() ?? '—'}</Text>
                </div>
                <div className="p-5 text-center">
                  <Text variant="caps-20">{entry.completedCoursesCount}</Text>
                </div>
                <div className="p-5 text-center">
                  <Text variant="caps-20">{entry.completedLessonsCount}</Text>
                </div>
              </div>
            )
          })}

          {rating.length === 0 && (
            <div className="p-10 text-center">
              <Text variant="caps-20" className="text-muted-foreground">
                NO DATA YET
              </Text>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
