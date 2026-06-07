import { useCreateWallet, useLoginWithOAuth } from '@privy-io/react-auth'
import { useRouter } from '@tanstack/react-router'
import { usePostHog } from '@posthog/react'
import { navigateAfterAuth } from '@/lib/redirect'
import { SignUpOptionButton } from './sign-up-option-button'

// Privy's `onComplete` can fire more than once per login (StrictMode double-invoke in dev, and
// re-fires on remount after the OAuth redirect). Without this guard, `createWallet()` runs twice
// and provisions two embedded wallets for the same user. Module-level so it survives remounts.
const walletCreationAttempted = new Set<string>()

interface SignUpGoogleButtonProps {
  /** Where to land after login; falls back to the dashboard. */
  redirect?: string
}

export const SignUpGoogleButton = ({ redirect }: SignUpGoogleButtonProps) => {
  const { createWallet } = useCreateWallet()
  const router = useRouter()
  const posthog = usePostHog()
  const { initOAuth } = useLoginWithOAuth({
    onComplete: async ({ isNewUser, user }) => {
      if (isNewUser && user?.id && !walletCreationAttempted.has(user.id)) {
        walletCreationAttempted.add(user.id)
        const hasEmbedded = user.linkedAccounts.some(
          (a) => a.type === 'wallet' && 'walletClientType' in a && a.walletClientType === 'privy',
        )
        if (!hasEmbedded) {
          try {
            await createWallet()
          } catch {
            walletCreationAttempted.delete(user.id)
          }
        }
        if (user?.id) {
          posthog.identify(user.id, { email: user.google?.email })
          posthog.capture('user_signed_up', { method: 'google' })
        }
      } else {
        if (user?.id) {
          posthog.identify(user.id, { email: user.google?.email })
          posthog.capture('user_logged_in', { method: 'google' })
        }
      }
      navigateAfterAuth(router, redirect)
    },
  })

  return (
    <SignUpOptionButton
      number="01"
      label="Google"
      className="md:-translate-x-20"
      onClick={() => initOAuth({ provider: 'google' })}
    />
  )
}
