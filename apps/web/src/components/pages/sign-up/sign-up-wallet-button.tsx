import { useLogin } from '@privy-io/react-auth'
import { useRouter } from '@tanstack/react-router'
import { usePostHog } from '@posthog/react'
import { navigateAfterAuth } from '@/lib/redirect'
import { SignUpOptionButton } from './sign-up-option-button'

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
    <SignUpOptionButton
      number="02"
      label="WEB3 WALLET"
      className="md:translate-x-20"
      onClick={() => login({ loginMethods: ['wallet'] })}
    />
  )
}
