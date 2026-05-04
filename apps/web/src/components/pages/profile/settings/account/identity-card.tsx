import { usePrivy, useLinkAccount } from '@privy-io/react-auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Text, textVariants } from '@/components/ui/text'
import { SettingsCard, SettingsCardRow } from '../settings-card'

export const IdentityCard = () => {
  const { user } = usePrivy()
  const { linkGoogle } = useLinkAccount({
    onSuccess: ({ linkedAccount }) => {
      if (linkedAccount.type === 'google_oauth') toast.success('Google account linked')
    },
  })

  if (!user) return null

  const googleEmail = user.google?.email ?? null

  return (
    <SettingsCard title="IDENTITY" description="The email and identity used to sign in.">
      {googleEmail ? (
        <SettingsCardRow label="Email">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={textVariants({ variant: 'caps-20' }) + ' break-all'}>{googleEmail}</span>
          </div>
        </SettingsCardRow>
      ) : (
        <Button variant="outline-white" size="sm" className="w-fit" onClick={() => linkGoogle()}>
          <Text variant="caps-20">Link Google</Text>
        </Button>
      )}
    </SettingsCard>
  )
}
