import { usePrivy } from '@privy-io/react-auth'
import { EmbeddedWalletCard } from './embedded-wallet-card'
import { ConnectedWalletCard } from './connected-wallet-card'
import { IdentityCard } from './identity-card'

const getPrimaryAccount = <T extends { firstVerifiedAt: Date | null }>(accounts: T[]): T | null => {
  const dated = accounts.filter((a) => a.firstVerifiedAt)
  if (dated.length === 0) return accounts[0] ?? null
  return dated.reduce((earliest, a) => {
    if (!earliest) return a
    return a.firstVerifiedAt!.getTime() < earliest.firstVerifiedAt!.getTime() ? a : earliest
  })
}

export const AccountTab = () => {
  const { user } = usePrivy()

  const wallets =
    user?.linkedAccounts.filter((a): a is Extract<typeof a, { type: 'wallet' }> => a.type === 'wallet') ?? []
  const embedded = wallets.find((w) => w.walletClientType === 'privy')
  const connected = wallets.find((w) => w.walletClientType !== 'privy')

  const primary = user ? getPrimaryAccount(user.linkedAccounts) : null
  const connectedIsPrimary = !!connected && primary?.type === 'wallet' && primary.address === connected.address

  return (
    <div className="flex flex-col gap-10 sm:gap-5">
      {embedded && <EmbeddedWalletCard address={embedded.address} />}
      <ConnectedWalletCard
        address={connected?.address ?? null}
        provider={connected?.walletClientType ?? null}
        isPrimary={connectedIsPrimary}
      />
      <IdentityCard />
    </div>
  )
}
