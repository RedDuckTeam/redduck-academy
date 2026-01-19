import { cn } from '@/lib/utils'
import { Text } from '../../ui/text'
import { LongArrowRight } from '../../ui/icons/long-arrow-right'
import { useCallback, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { authClient } from '@/lib/auth-client'

export const SignUpWalletButton = () => {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const handleSignInWithMessage = async () => {
    if (!address) return
    const { data: nonce, error: nonceError } = await authClient.siwe.nonce({
      walletAddress: address,
    })

    if (nonceError || !nonce) throw new Error('Failed to get nonce')

    const message = `Sign in with Ethereum. \n\nNonce: ${nonce.nonce}`
    const signature = await signMessageAsync({ message })

    const { data, error } = await authClient.siwe.verify({
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
        'rounded-[80px] translate-x-20 cursor-pointer bg-black py-[18px] px-[70px] flex justify-between items-center w-[850px]',
      )}
      onClick={handleSignInWithWallet}
    >
      <Text variant="title-80" className="text-background">
        02
      </Text>
      <Text variant="subtitle-45" className="text-background">
        WEB3 WALLET
      </Text>
      <LongArrowRight />
    </button>
  )
}
