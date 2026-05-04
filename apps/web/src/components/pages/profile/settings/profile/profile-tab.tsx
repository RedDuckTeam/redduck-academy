import { SettingsCard, SettingsCardRow } from '../settings-card'
import { ChangeUsername } from './change-username'
import { PrivateProfileSwitch } from './private-profile-switch'
import { MemberSince } from './member-since'

export const ProfileTab = () => {
  return (
    <SettingsCard title="PROFILE">
      <SettingsCardRow label="Handle">
        <ChangeUsername />
      </SettingsCardRow>
      <SettingsCardRow label="Visibility">
        <PrivateProfileSwitch />
      </SettingsCardRow>
      <SettingsCardRow label="Member since">
        <MemberSince />
      </SettingsCardRow>
    </SettingsCard>
  )
}
