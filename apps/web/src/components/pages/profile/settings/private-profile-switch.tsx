import { useUserSettings, useUpdateUserSettings } from '@/hooks/api/user/useUserSettings'
import { SettingsSwitch } from './settings-switch'

export const PrivateProfileSwitch = () => {
  const { data } = useUserSettings()
  const { mutate } = useUpdateUserSettings()
  const isBanned = data?.blacklisted ?? false
  return (
    <SettingsSwitch
      label="Private Profile"
      tooltip={isBanned ? 'Banned accounts must keep a private profile.' : 'Your profile will be hidden from other users and rating table.'}
      checked={data?.isPrivate ?? true}
      onChange={(isPrivate) => mutate({ isPrivate })}
      disabled={isBanned}
    />
  )
}
