import { cn } from '@/lib/utils'
import { Text } from '../../ui/text'
import { LongArrowRight } from '../../ui/icons/long-arrow-right'
import { useLogin } from '@privy-io/react-auth'
import { useRouter } from '@tanstack/react-router'
import { usePostHog } from '@posthog/react'
import { navigateAfterAuth } from '@/lib/redirect'

interface SignUpWalletButtonProps {
  /** Where to land after login; falls back to the dashboard. */
  redirect?: string
}

export const SignUpWalletButton = ({ redirect }: SignUpWalletButtonProps) => {
  const router = useRouter()
  const posthog = usePostHog()
  const { login } = useLogin({
    onComplete: ({ isNewUser, user }) => {
      if (user?.id) {
        posthog.identify(user.id)
        posthog.capture(isNewUser ? 'user_signed_up' : 'user_logged_in', { method: 'wallet' })
      }
      navigateAfterAuth(router, redirect)
    },
  })

  return (
    <button
      className={cn(
        'flex w-full max-w-[850px] min-h-[100px] cursor-pointer items-center justify-between rounded-[80px] bg-foreground px-10 py-[18px] md:translate-x-20 md:min-h-0 md:px-[70px]',
      )}
      onClick={() => login({ loginMethods: ['wallet'] })}
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
