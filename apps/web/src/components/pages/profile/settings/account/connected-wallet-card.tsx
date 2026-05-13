import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { usePrivy, useLinkAccount } from '@privy-io/react-auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Text, textVariants } from '@/components/ui/text'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { shortAddress } from '@/lib/utils'
import { SettingsCard, SettingsCardRow } from '../settings-card'

interface ConnectedWalletCardProps {
  address: string | null
  provider: string | null
  isPrimary: boolean
}

const providerLabel = (clientType: string | null | undefined): string => {
  if (!clientType) return 'External Wallet'
  if (clientType === 'metamask') return 'MetaMask'
  if (clientType === 'coinbase_wallet') return 'Coinbase Wallet'
  if (clientType === 'wallet_connect') return 'WalletConnect'
  return clientType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const ConnectedWalletCard = ({ address, provider, isPrimary }: ConnectedWalletCardProps) => {
  const [copied, setCopied] = useState(false)
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const { unlinkWallet } = usePrivy()
  const { linkWallet } = useLinkAccount({
    onSuccess: ({ linkedAccount }) => {
      if (linkedAccount.type === 'wallet') toast.success('Wallet linked')
    },
  })

  const handleCopy = () => {
    if (!address) return
    void navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDisconnect = async () => {
    if (!address) return
    setIsDisconnecting(true)
    try {
      await unlinkWallet(address)
      toast.success('Wallet disconnected')
      setIsDisconnectDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect wallet')
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (!address) {
    return (
      <SettingsCard title="CONNECTED WALLET" description="External wallet you've connected.">
        <Button variant="outline-white" size="sm" className="w-fit" onClick={() => linkWallet()}>
          <Text variant="caps-20">Connect wallet</Text>
        </Button>
      </SettingsCard>
    )
  }

  return (
    <SettingsCard title="CONNECTED WALLET">
      <SettingsCardRow label="Address">
        <div className="flex items-center gap-3">
          <span className={textVariants({ variant: 'caps-20' }) + ' text-primary font-mono'}>
            {shortAddress(address)}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy wallet address"
            className="text-white/50 hover:text-white transition-colors"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>
      </SettingsCardRow>
      <SettingsCardRow label="Provider">
        <span className={textVariants({ variant: 'caps-20' })}>{providerLabel(provider)}</span>
      </SettingsCardRow>
      {!isPrimary && (
        <Button
          variant="outline-white"
          size="sm"
          onClick={() => setIsDisconnectDialogOpen(true)}
          className="mt-5 w-fit"
        >
          <Text variant="caps-20">Disconnect</Text>
        </Button>
      )}
      <ConfirmDialog
        open={isDisconnectDialogOpen}
        onOpenChange={setIsDisconnectDialogOpen}
        onConfirm={handleDisconnect}
        title="Disconnect wallet?"
        description="This wallet will be unlinked from your account. You'll need to reconnect it to use it again."
        confirmLabel="Disconnect"
        isLoading={isDisconnecting}
      />
    </SettingsCard>
  )
}
