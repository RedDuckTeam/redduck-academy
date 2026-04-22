import { usePrivy, useLinkAccount, useCreateWallet } from '@privy-io/react-auth'
import { Text, textVariants } from '@/components/ui/text'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export const LinkAccounts = () => {
  const { user } = usePrivy()
  const { linkGoogle } = useLinkAccount({
    onSuccess: () => toast.success('Account linked'),
  })

  const { linkWallet } = useLinkAccount({
    onSuccess: () => toast.success('Account linked'),
  })

  if (!user) return null

  const hasGoogle = Boolean(user.google)
  const hasExternalWallet = user.linkedAccounts.some((a) => a.type === 'wallet' && a.walletClientType !== 'privy')

  if (hasGoogle && hasExternalWallet) return null

  return (
    <Button
      size={'sm'}
      variant={'outline-white'}
      onClick={() => (hasGoogle ? linkWallet() : linkGoogle())}
      className="flex items-center gap-3 w-fit"
    >
      <p className={textVariants({ variant: 'caps-20' })}>Link</p>
      {!hasGoogle && <Text variant="caps-20">Google</Text>}
      {!hasExternalWallet && <Text variant="caps-20">Wallet</Text>}
    </Button>
  )
}
