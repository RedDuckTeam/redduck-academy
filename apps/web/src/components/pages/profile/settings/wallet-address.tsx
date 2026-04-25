import { usePrivy, useExportWallet } from '@privy-io/react-auth'
import { textVariants } from '@/components/ui/text'
import { Copy, Check, Download } from 'lucide-react'
import { useState } from 'react'
import { shortAddress } from '@/lib/utils'
import { BaseTooltip } from '@/components/ui/base-tooltip'

type WalletRowProps = {
  address: string
  embedded: boolean
}

const WalletRow = ({ address, embedded }: WalletRowProps) => {
  const [copied, setCopied] = useState(false)
  const { exportWallet } = useExportWallet()

  const handleCopy = () => {
    void navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex sm:items-center gap-3 max-sm:flex-col">
      <div className="flex items-center gap-3">
        <p className={textVariants({ variant: 'caps-20' })}>{embedded ? 'Embedded Wallet' : 'Connected Wallet'}</p>
        {embedded && (
          <BaseTooltip triggerLabel="About this wallet" triggerClassName="text-white">
            This is an embedded wallet automatically created for you. It&apos;s secured by your google sign in and
            managed on your behalf — no seed phrase required.
          </BaseTooltip>
        )}
      </div>
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
        {embedded && (
          <button
            type="button"
            onClick={() => exportWallet({ address })}
            aria-label="Export wallet private key"
            className="text-white/50 hover:text-white transition-colors"
          >
            <Download className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export const WalletAddress = () => {
  const { user } = usePrivy()

  if (!user) return null

  const wallets = user.linkedAccounts
    .filter((a): a is Extract<typeof a, { type: 'wallet' }> => a.type === 'wallet')
    .map((a) => ({ address: a.address, embedded: a.walletClientType === 'privy' }))

  if (wallets.length === 0) return null

  return (
    <div className="flex flex-col gap-5">
      {wallets.map((w) => (
        <WalletRow key={w.address} address={w.address} embedded={w.embedded} />
      ))}
    </div>
  )
}
