import { Text } from '@/components/ui/text'
import { ProgressCard } from '@/components/pages/home/progress/progress-cards/progress-card'
import { useProgressCards } from '@/hooks/api/user/useProgressCards'
import { useRating } from '@/hooks/api/user/useRating'
import { useSession } from '@/hooks/useSession'
import { HomepageGrid } from '@/components/ui/icons/homepage-grid'
import { useTheme } from '@/components/providers/theme-context'
import { cn } from '@/lib/utils'

const ordinalSuffix = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export const RatingPage = () => {
  const { theme } = useTheme()
  const { session, isPending } = useSession()
  const { data: progressCards } = useProgressCards()
  const { data: rating = [] } = useRating()

  const isLoggedIn = !isPending && !!session
  const userName = session?.user?.name ?? session?.user?.email ?? null
  const placeInRanking = isLoggedIn ? (progressCards?.placeInRanking ?? 0) : 0
  const completedLessonsCount = isLoggedIn ? (progressCards?.completedLessonsCount ?? 0) : 0

  return (
    <main className="flex flex-col min-h-screen">
      <div className="relative flex flex-col gap-9 px-6 pb-14 md:px-10 md:pb-[60px] xl:px-[60px]">
        <HomepageGrid
          className="absolute top-0 left-[60px] w-[calc(100%-121px)] z-[-1]"
          fill={theme === 'dark' ? '#222222' : '#E0DEDA'}
          lines={theme === 'dark' ? '#333333' : '#CCCCCC'}
        />
        <div className="flex max-xl:flex-col xl:items-center xl:justify-between gap-6 pt-9">
          <div className="flex items-center gap-6">
            <div className="bg-primary p-4 text-black">
              <Text variant="caps-20">
                {userName ? `WELL DONE ${userName.toUpperCase()}!` : 'JOIN TO TRACK YOUR RANKING!'}
              </Text>
            </div>
          </div>
          <div className="xl:flex max-xl:grid max-xl:w-full grid-cols-2 border border-border">
            <ProgressCard
              firstNum={ordinalSuffix(placeInRanking)}
              text="PLACE IN RANKING"
              className="xl:border-r max-xl:border-b border-border"
            />
            <ProgressCard firstNum={String(completedLessonsCount)} text="LESSONS PASSED" />
          </div>
        </div>
      </div>

      {/* Rating table section */}
      <div className="bg-header px-6 py-14 md:px-10 md:py-[60px] xl:px-[60px] text-[#e0deda] flex flex-col gap-10">
        <Text variant="subtitle-32">_TOTAL RATING</Text>

        <div className="border border-border">
          <div className="grid grid-cols-[100px_1fr_250px_250px] border-b border-border">
            <div className="p-5">
              <Text variant="caps-20">RATING</Text>
            </div>
            <div className="p-5">
              <Text variant="caps-20">STUDENT</Text>
            </div>
            <div className="p-5 text-center">
              <Text variant="caps-20">COURSES COMPLETED</Text>
            </div>
            <div className="p-5 text-center">
              <Text variant="caps-20">LESSONS COMPLETED</Text>
            </div>
          </div>

          {rating.map((entry) => {
            const isCurrentUser = entry.userId === session?.user?.id
            return (
              <div
                key={entry.userId}
                className={cn(
                  'grid grid-cols-[80px_1fr_180px_180px] border-b border-border last:border-b-0',
                  isCurrentUser && 'border border-primary',
                )}
              >
                <div className="p-5">
                  <Text variant="caps-20" className="text-primary">
                    {String(entry.rank).padStart(2, '0')}.
                  </Text>
                </div>
                <div className="p-5">
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
