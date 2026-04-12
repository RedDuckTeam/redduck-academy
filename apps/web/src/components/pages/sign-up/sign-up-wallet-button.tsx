import { cn } from '@/lib/utils'
import { Text } from '../../ui/text'
import { LongArrowRight } from '../../ui/icons/long-arrow-right'
import { useCallback, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { getAuthClient } from '@/lib/auth-client'

export const SignUpWalletButton = () => {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const handleSignInWithMessage = async () => {
    if (!address) return
    const { data: nonce, error: nonceError } = await getAuthClient().siwe.nonce({
      walletAddress: address,
    })

    if (nonceError || !nonce) throw new Error('Failed to get nonce')

    const message = `Sign in with Ethereum. \n\nNonce: ${nonce.nonce}`
    const signature = await signMessageAsync({ message })

    const { data } = await getAuthClient().siwe.verify({
      message,
      signature,
      walletAddress: address,
    })

    if (data) {
      console.log('Authentication successful:', data.user)
    }
  }

  useEffect(() => {
    if (!address) return

    handleSignInWithMessage()
  }, [address])

  const handleOpenAppKit = useCallback(async () => {
    const { useAppKit } = await import('@reown/appkit/react')
    const { open } = useAppKit()
    await open()
  }, [])

  const handleSignInWithWallet = useCallback(async () => {
    if (!address) {
      await handleOpenAppKit()
    } else {
      await handleSignInWithMessage()
    }
  }, [])

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
