import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { textVariants } from '@/components/ui/text'
import { shortAddress } from '@/lib/utils'
import { SettingsCard, SettingsCardRow } from '../settings-card'

interface EmbeddedWalletCardProps {
  address: string
}

export const EmbeddedWalletCard = ({ address }: EmbeddedWalletCardProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <SettingsCard title="EMBEDDED WALLET" description="Custodial wallet generated for your account.">
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
      <p className="mt-5 border-l-2 border-primary bg-white/5 px-4 py-3 text-white/70 text-[14px] leading-[20px]">
        To export this wallet&apos;s private key, go to <span className="uppercase">Security</span> tab
      </p>
    </SettingsCard>
  )
}
