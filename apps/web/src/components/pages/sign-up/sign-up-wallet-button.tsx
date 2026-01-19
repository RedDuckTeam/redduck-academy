import { cn } from '@/lib/utils'
import { Text } from '../../ui/text'
import { LongArrowRight } from '../../ui/icons/long-arrow-right'
import { authClient } from '@/lib/auth-client'

export const SignUpWalletButton = () => {
  const handleSignUpWithGoogle = async () => {
    try {
      const response = await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.href,
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <button
      className={cn(
        'rounded-[80px] translate-x-20 cursor-pointer bg-black py-[18px] px-[70px] flex justify-between items-center w-[850px]',
        '',
      )}
      onClick={handleSignUpWithGoogle}
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
