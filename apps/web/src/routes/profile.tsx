import { createFileRoute } from '@tanstack/react-router'
import { PageGridBackground } from '@/components/page-section/page-grid-background'
import { PageStatsCards } from '@/components/page-section/page-stats-cards'
import { useProgressCards } from '@/hooks/api/user/useProgressCards'
import { useSession } from '@/hooks/useSession'
import { createPageMeta } from '@/lib/seo'
import { PageAvatar } from '@/components/page-section/avatar/page-avatar'
import { ChangeName } from '@/components/pages/profile/name/change-name'
import { ChangeAvatar } from '@/components/pages/profile/avatar/change-avatar'
import { Text } from '@/components/ui/text'
import { ordinalSuffix } from '@/lib/format-ordinal'
import { PageAvatarText } from '@/components/page-section/avatar/page-avatar-text'
import { Settings } from '@/components/pages/profile/settings/settings'
import { ChangeBio } from '@/components/pages/profile/bio/change-bio'
import { useUserSettings } from '@/hooks/api/user/useUserSettings'

export const Route = createFileRoute('/profile')({
  ssr: false,
  head: () =>
    createPageMeta({
      title: 'Profile',
      description: 'Your progress and profile on RedDuck Academy.',
      path: '/profile',
    }),
  component: ProfilePage,
})

function ProfilePage() {
  const { session, isPending } = useSession()
  const { data: progressCards } = useProgressCards()
  const { data: userSettings } = useUserSettings()

  if (isPending) {
    return null
  }

  const imageUrl = session?.user.image

  const placeInRanking = progressCards?.placeInRanking ?? 0
  const completedLessonsCount = progressCards?.completedLessonsCount ?? 0

  return (
    <main className="flex min-h-screen flex-col">
      <PageGridBackground>
        <div className="flex max-xl:flex-col xl:flex-row xl:items-start xl:justify-between gap-6 pt-9 xl:gap-2">
          <div className="flex sm:gap-5 gap-3">
            <div className="pt-2.5">{<ChangeAvatar imageUrl={imageUrl ?? undefined} />}</div>
            <PageAvatarText message={<ChangeName />} />
          </div>
          <PageStatsCards
            items={[
              {
                firstNum: placeInRanking ? placeInRanking.toString() : '-',
                secondNum: placeInRanking ? ordinalSuffix(placeInRanking) : undefined,
                text: 'PLACE IN RANKING',
                className: 'border-r border-border',
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
        <ChangeBio initialBio={userSettings?.bio ?? null} />
      </div>
      <div className="px-6 py-14 md:px-10 md:py-[60px] xl:px-[60px]  flex flex-col gap-10 border-t border-border">
        <Text variant="subtitle-32">_CERTIFICATES</Text>
      </div>
      <div className=" px-6 py-14 bg-header text-[#e0deda] md:px-10 md:py-[60px] xl:px-[60px] flex flex-col gap-10">
        <Text variant="subtitle-32">_SETTINGS</Text>
        <Settings />
      </div>
    </main>
  )
}
