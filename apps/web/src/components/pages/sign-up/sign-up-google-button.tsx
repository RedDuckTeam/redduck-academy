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
        'flex w-full max-w-[850px] min-h-[100px] cursor-pointer items-center justify-between rounded-[80px] bg-black px-10 py-[18px] md:-translate-x-20 md:min-h-0 md:px-[70px]',
      )}
      onClick={handleSignUpWithGoogle}
    >
      <Text
        variant="title-80"
        className="min-h-0 text-background max-md:text-[32px] max-md:leading-none"
      >
        01
      </Text>
      <Text
        variant="subtitle-45"
        className="text-background max-md:text-[20px] max-md:leading-normal max-md:min-h-0"
      >
        Google
      </Text>
      <LongArrowRight />
    </button>
  )
}
