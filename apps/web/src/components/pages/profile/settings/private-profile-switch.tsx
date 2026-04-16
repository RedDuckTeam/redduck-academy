import { useUserSettings, useUpdateUserSettings } from '@/hooks/api/user/useUserSettings'
import { SettingsSwitch } from './settings-switch'

export const PrivateProfileSwitch = () => {
  const { data } = useUserSettings()
  const { mutate } = useUpdateUserSettings()
  return (
    <SettingsSwitch
      label="Private Profile"
      checked={data?.isPrivate ?? true}
      onChange={(isPrivate) => mutate({ isPrivate })}
    />
  )
}
