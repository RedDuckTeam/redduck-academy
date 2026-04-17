import { useUserSettings, useUpdateUserSettings } from '@/hooks/api/user/useUserSettings'
import { SettingsSwitch } from './settings-switch'

export const SkipPrerequisitesSwitch = () => {
  const { data } = useUserSettings()
  const { mutate } = useUpdateUserSettings()
  return (
    <SettingsSwitch
      label="Skip Prerequisites"
      tooltip="Unlock all courses regardless of completion order."
      checked={data?.skipPrerequisites ?? false}
      onChange={(skipPrerequisites) => mutate({ skipPrerequisites })}
    />
  )
}
