import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProfileTab } from './profile/profile-tab'
import { PreferencesTab } from './preferences/preferences-tab'
import { AccountTab } from './account/account-tab'
import { SecurityTab } from './security/security-tab'
import { SignOutButton } from './sign-out-button'

type TabValue = 'profile' | 'preferences' | 'account' | 'security'

export const Settings = () => {
  const { user } = usePrivy()
  const hasEmbeddedWallet = !!user?.linkedAccounts.some(
    (a) => a.type === 'wallet' && a.walletClientType === 'privy',
  )

  const tabs = [
    { value: 'profile', label: 'Profile' },
    { value: 'preferences', label: 'Preferences' },
    { value: 'account', label: 'Account' },
    ...(hasEmbeddedWallet ? [{ value: 'security', label: 'Security' }] : []),
  ] as const

  const [tab, setTab] = useState<TabValue>('profile')

  return (
    <div className="flex flex-col gap-10">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="flex w-full flex-col gap-7">
        <TabsList variant="line" className="hidden md:flex w-full max-w-xl justify-start gap-4">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="!text-base text-white group-data-[variant=line]/tabs-list:data-[state=active]:text-white active:text-white hover:text-white"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="md:hidden">
          <Select value={tab} onValueChange={(v) => setTab(v as TabValue)}>
            <SelectTrigger className="text-white border-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white">
              {tabs.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="profile" className="mt-0">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="preferences" className="mt-0">
          <PreferencesTab />
        </TabsContent>
        <TabsContent value="account" className="mt-0">
          <AccountTab />
        </TabsContent>
        {hasEmbeddedWallet && (
          <TabsContent value="security" className="mt-0">
            <SecurityTab />
          </TabsContent>
        )}
      </Tabs>

      <div className="flex justify-end">
        <SignOutButton />
      </div>
    </div>
  )
}
