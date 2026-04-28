import { PrivateProfileSwitch } from './private-profile-switch'
import { SkipPrerequisitesSwitch } from './skip-prerequisites-switch'
import { SignOutButton } from './sign-out-button'
import { ChangeUsername } from './change-username'
import { WalletAddress } from './wallet-address'
import { LinkAccounts } from './link-accounts'

export const Settings = () => {
  return (
    <div className="flex flex-col gap-14">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        <div className="flex flex-col gap-7">
          <ChangeUsername />
          <WalletAddress />
          <LinkAccounts />
        </div>
        <div className="flex flex-col gap-7 ">
          <PrivateProfileSwitch />
          <SkipPrerequisitesSwitch />
        </div>
      </div>
      <div className="flex justify-end">
        <SignOutButton />
      </div>
    </div>
  )
}
