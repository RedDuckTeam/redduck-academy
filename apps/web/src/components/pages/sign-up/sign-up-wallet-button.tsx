import { cn } from '@/lib/utils'
import { Text } from '../../ui/text'
import { LongArrowRight } from '../../ui/icons/long-arrow-right'
import { useCallback } from 'react'
import { useAccount, useSignMessage, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { getAuthClient } from '@/lib/auth-client'
import { toast } from 'sonner'

export const SignUpWalletButton = () => {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { connectAsync } = useConnect()
  const handleSignInWithMessage = async () => {
    if (!address) return
    try {
      const { data: nonce, error: nonceError } = await getAuthClient().siwe.nonce({
        walletAddress: address,
      })

      if (nonceError || !nonce) throw new Error('Failed to get nonce')

      const message = `Sign in with Ethereum. \n\nNonce: ${nonce.nonce}`
      const signature = await signMessageAsync({ message })

      const { data, error } = await getAuthClient().siwe.verify({
        message,
        signature,
        walletAddress: address,
      })

      if (error || !data) throw new Error(error?.message ?? 'Verification failed')

      window.location.assign('/')
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User rejected the request.')) return
      }
      console.error(error)
      toast.error('Failed to sign in with wallet. Please try again.')
    }
  }

  const handleSignInWithWallet = useCallback(async () => {
    try {
      if (!address) {
        await connectAsync({ connector: injected() })
      }
      await handleSignInWithMessage()
    } catch (error) {
      if (error instanceof Error && error.message.includes('Provider not found.')) {
        toast.error('No wallet extension found. Please install MetaMask or another wallet.')
        return
      }
      if (error instanceof Error && error.message.includes('User rejected the request.')) return
      toast.error('Failed to connect wallet. Please try again.')
    }
  }, [address])

  return (
    <button
      className={cn(
        'flex w-full max-w-[850px] min-h-[100px] cursor-pointer items-center justify-between rounded-[80px] bg-foreground px-10 py-[18px] md:translate-x-20 md:min-h-0 md:px-[70px]',
      )}
      onClick={handleSignInWithWallet}
    >
      <Text variant="title-80" className="min-h-0 text-background max-md:text-[32px] max-md:leading-none">
        02
      </Text>
      <Text variant="subtitle-45" className="text-background max-md:text-[20px] max-md:leading-normal max-md:min-h-0">
        WEB3 WALLET
      </Text>
      <LongArrowRight className="[&_path]:fill-background" />
    </button>
  )
}
