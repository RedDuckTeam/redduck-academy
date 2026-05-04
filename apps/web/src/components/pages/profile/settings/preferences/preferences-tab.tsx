import { SettingsCard, SettingsCardRow } from '../settings-card'
import { SkipPrerequisitesSwitch } from './skip-prerequisites-switch'
import { ThemeSwitch } from './theme-switch'

export const PreferencesTab = () => {
  return (
    <SettingsCard title="PREFERENCES">
      <SettingsCardRow label="Skip prerequisites" labelClassName="sm:w-[200px]">
        <SkipPrerequisitesSwitch />
      </SettingsCardRow>
      <SettingsCardRow label="Theme" labelClassName="sm:w-[200px]">
        <ThemeSwitch />
      </SettingsCardRow>
    </SettingsCard>
  )
}
