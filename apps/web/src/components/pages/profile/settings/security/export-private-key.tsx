import { ArrowRight, AlertTriangle } from 'lucide-react'
import { usePrivy, useExportWallet } from '@privy-io/react-auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { SettingsCard } from '../settings-card'

const STEPS = [
  'Make sure you are alone and your screen is not being shared or recorded.',
  'Disable screen capture browser extensions before continuing.',
  'Have a secure place ready (password manager, hardware wallet, paper safe).',
]

export const ExportPrivateKey = () => {
  const { user } = usePrivy()
  const { exportWallet } = useExportWallet()

  const embeddedWallet = user?.linkedAccounts.find(
    (a): a is Extract<typeof a, { type: 'wallet' }> => a.type === 'wallet' && a.walletClientType === 'privy',
  )

  const handleExport = async () => {
    if (!embeddedWallet) {
      toast.error('No embedded wallet found')
      return
    }
    try {
      await exportWallet({ address: embeddedWallet.address })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export private key')
    }
  }

  return (
    <SettingsCard
      title="EXPORT PRIVATE KEY"
      description="Reveal the private key for your embedded wallet. This is irreversible — handle with care."
    >
      <div className="border border-yellow-400/40 bg-yellow-400/10 p-4 sm:p-5 flex gap-3">
        <AlertTriangle className="size-5 shrink-0 text-yellow-400 mt-0.5" strokeWidth={2} />
        <div className="flex flex-col gap-1.5">
          <Text variant="caps-20" className="text-yellow-400">
            Your private key is the master password to your wallet.
          </Text>
          <Text variant="main-16" className="text-white/70">
            Anyone with this key can drain your funds. RedDuck staff will <span className="text-white">never</span> ask
            you for it. Only export it if you know exactly what you&apos;re doing.
          </Text>
        </div>
      </div>

      <ol className="flex flex-col gap-3 mt-5">
        {STEPS.map((step, i) => (
          <li key={step} className="flex gap-4">
            <span className="text-primary font-mono text-[14px] tracking-wide shrink-0">
              {String(i + 1).padStart(2, '0')}.
            </span>
            <Text variant="main-16" className="text-white/80">
              {step}
            </Text>
          </li>
        ))}
      </ol>

      <Button
        variant="default"
        size="sm"
        onClick={handleExport}
        disabled={!embeddedWallet}
        className="mt-5 w-fit gap-2"
      >
        <Text variant="caps-20">I understand — continue</Text>
        <ArrowRight className="size-4" strokeWidth={2} />
      </Button>
    </SettingsCard>
  )
}
