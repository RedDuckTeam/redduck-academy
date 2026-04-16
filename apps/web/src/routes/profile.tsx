import { createFileRoute, redirect } from '@tanstack/react-router'
import { Text } from '@/components/ui/text'
import { useSession } from '@/hooks/useSession'
import { useUserSettings, useUpdateUserSettings } from '@/hooks/api/user/useUserSettings'

export const Route = createFileRoute('/profile')({
  ssr: false,
  component: ProfilePage,
})

function ProfilePage() {
  const { session, isPending } = useSession()
  const { data: settings } = useUserSettings()
  const { mutate: updateSettings, isPending: isSaving } = useUpdateUserSettings()

  if (!isPending && !session) {
    throw redirect({ to: '/sign-up' })
  }

  return (
    <main className="mx-5 mb-[60px] flex min-h-screen flex-col gap-10 md:mx-[60px]">
      <Text variant="subtitle-32">_PROFILE</Text>

      <div className="flex flex-col gap-6 max-w-xl">
        <div className="flex flex-col gap-2">
          <Text variant="caps-20">Account</Text>
          <Text variant="main-18" className="text-muted-foreground">
            {session?.user?.email ?? session?.user?.name ?? ''}
          </Text>
        </div>

        <div className="border border-border p-6 flex flex-col gap-4">
          <Text variant="caps-20">Learning Preferences</Text>
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary cursor-pointer"
              checked={settings?.skipPrerequisites ?? false}
              disabled={isSaving || !settings}
              onChange={(e) => {
                updateSettings({ skipPrerequisites: e.target.checked })
              }}
            />
            <div className="flex flex-col gap-1">
              <Text variant="main-18">I want to complete courses in any order</Text>
              <Text variant="main-14" className="text-muted-foreground">
                Disables course prerequisites — all courses will be accessible regardless of completion order.
              </Text>
            </div>
          </label>
        </div>
      </div>
    </main>
  )
}
