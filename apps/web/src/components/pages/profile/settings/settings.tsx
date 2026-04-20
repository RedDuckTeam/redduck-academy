import { PrivateProfileSwitch } from './private-profile-switch'
import { SkipPrerequisitesSwitch } from './skip-prerequisites-switch'
import { SignOutButton } from './sign-out-button'
import { ChangeUsername } from './change-username'

export const Settings = () => {
  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-5">
        <ChangeUsername />
        <PrivateProfileSwitch />
        <SkipPrerequisitesSwitch />
      </div>
      <SignOutButton />
    </div>
  )
}
