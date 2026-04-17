import { PrivateProfileSwitch } from './private-profile-switch'
import { SignOutButton } from './sign-out-button'

export const Settings = () => {
  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-2">
        <PrivateProfileSwitch />
      </div>
      <SignOutButton />
    </div>
  )
}
