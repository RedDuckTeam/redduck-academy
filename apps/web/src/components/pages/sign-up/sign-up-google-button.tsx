import { cn } from '@/lib/utils'
import { Text } from '../../ui/text'
import { LongArrowRight } from '../../ui/icons/long-arrow-right'
import { authClient } from '@/lib/auth-client'
import { env } from '@/env'

export const SignUpGoogleButton = () => {
  const handleSignUpWithGoogle = async () => {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: env.VITE_APP_URL,
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <button
      className={cn(
        'rounded-[80px] -translate-x-20 cursor-pointer bg-black py-[18px] px-[70px] flex justify-between items-center w-[850px]',
        '',
      )}
      onClick={handleSignUpWithGoogle}
    >
      <Text variant="title-80" className="text-background">
        01
      </Text>
      <Text variant="subtitle-45" className="text-background">
        Google
      </Text>
      <LongArrowRight />
    </button>
  )
}
