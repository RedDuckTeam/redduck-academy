import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageGridBackground } from '@/components/page-section/page-grid-background'
import { PageStatsCards } from '@/components/page-section/page-stats-cards'
import { useProgressCards } from '@/hooks/api/user/useProgressCards'
import { useSession } from '@/hooks/useSession'
import { getPublicProfile } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'
import { createPageMeta } from '@/lib/seo'
import { ChangeName } from '@/components/pages/profile/name/change-name'
import { ChangeAvatar } from '@/components/pages/profile/avatar/change-avatar'
import { Text } from '@/components/ui/text'
import { ordinalSuffix } from '@/lib/format-ordinal'
import { PageAvatarText } from '@/components/page-section/avatar/page-avatar-text'
import { Settings } from '@/components/pages/profile/settings/settings'
import { ChangeBio } from '@/components/pages/profile/bio/change-bio'
import { useUserSettings } from '@/hooks/api/user/useUserSettings'
import { ProfileCertificates } from '@/components/pages/profile/certificates/profile-certificates'
import type { PublicUserProfile } from '@/types/lesson'

export const Route = createFileRoute('/profile/$username')({
  ssr: true,
  loader: async ({ params, context: { queryClient } }) => {
    const profile = await queryClient
      .ensureQueryData({
        queryKey: queryKeys.profile.detail(params.username),
        queryFn: () => getPublicProfile(params.username),
        staleTime: 60 * 1000,
      })
      .catch(() => {
        throw notFound()
      })
    return { profile, username: params.username }
  },
  head: ({ loaderData, params }) => {
    const profile = loaderData?.profile
    const displayName = profile && !profile.isPrivate ? profile.name : params.username
    return createPageMeta({
      title: displayName,
      description: `${displayName}'s profile on RedDuck Academy.`,
      path: `/profile/${params.username}`,
    })
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { username } = Route.useParams()
  const { session } = useSession()

  const isOwn = !!session?.user && (session.user as { username?: string }).username === username

  if (isOwn) return <OwnProfile />
  return <OtherProfile />
}

function OwnProfile() {
  const { session } = useSession()
  const { data: progressCards } = useProgressCards()
  const { data: userSettings } = useUserSettings()

  const placeInRanking = progressCards?.placeInRanking ?? 0
  const completedLessonsCount = progressCards?.completedLessonsCount ?? 0
  const isBanned = userSettings?.blacklisted ?? false

  return (
    <main className="flex flex-col">
      <PageGridBackground>
        <div className="flex max-xl:flex-col xl:flex-row xl:items-start xl:justify-between gap-6 pt-9 xl:gap-2">
          <div className="flex sm:gap-5 gap-3">
            <div className="pt-2.5">
              <ChangeAvatar imageUrl={session?.user.image?.trim() || undefined} editable={!isBanned} />
            </div>
            <PageAvatarText message={<ChangeName editable={!isBanned} />} />
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
        <ChangeBio initialBio={userSettings?.bio ?? null} editable={!isBanned} />
      </div>
      <div className="px-6 py-14 md:px-10 md:py-[60px] xl:px-[60px] flex flex-col gap-10">
        <Text variant="subtitle-32">_CERTIFICATES</Text>
        <ProfileCertificates />
      </div>
      <div className="px-6 py-14 bg-header text-[#e0deda] md:px-10 md:py-[60px] xl:px-[60px] flex flex-col gap-10">
        <Text variant="subtitle-32">_SETTINGS</Text>
        <Settings />
      </div>
    </main>
  )
}

function OtherProfile() {
  const { profile } = Route.useLoaderData()

  const isPrivate = profile.isPrivate
  const publicProfile = isPrivate ? null : (profile as PublicUserProfile)

  return (
    <main className="flex flex-col">
      <PageGridBackground>
        <div className="flex max-xl:flex-col xl:flex-row xl:items-start xl:justify-between gap-6 pt-9 xl:gap-2">
          <div className="flex sm:gap-5 gap-3">
            <div className="pt-2.5">
              <ChangeAvatar
                imageUrl={isPrivate ? undefined : publicProfile!.image?.trim() || undefined}
                editable={false}
              />
            </div>
            <PageAvatarText
              message={<ChangeName name={isPrivate ? 'Private profile' : publicProfile!.name} editable={false} />}
            />
          </div>
          {!isPrivate && (
            <PageStatsCards
              items={[
                {
                  firstNum: publicProfile!.rank ? publicProfile!.rank.toString() : '-',
                  secondNum: publicProfile!.rank ? ordinalSuffix(publicProfile!.rank) : undefined,
                  text: 'PLACE IN RANKING',
                  className: 'border-r border-border',
                },
                {
                  firstNum: publicProfile!.completedLessonsCount
                    ? publicProfile!.completedLessonsCount.toString()
                    : '-',
                  text: 'LESSONS COMPLETED',
                },
              ]}
            />
          )}
        </div>
      </PageGridBackground>
      <div className="bg-header px-6 py-14 md:px-10 md:py-[60px] xl:px-[60px] text-[#e0deda] flex flex-col gap-10">
        <ChangeBio initialBio={isPrivate ? null : publicProfile!.bio} editable={false} isPrivate={isPrivate} />
      </div>
      <div className="px-6 py-14 md:px-10 md:py-[60px] xl:px-[60px] flex flex-col gap-10">
        <Text variant="subtitle-32">_CERTIFICATES</Text>
        <ProfileCertificates certificates={isPrivate ? undefined : publicProfile!.certificates} isPrivate={isPrivate} />
      </div>
    </main>
  )
}
