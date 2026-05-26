import { cn } from '@/lib/utils'
import { Text } from '../../ui/text'
import { LongArrowRight } from '../../ui/icons/long-arrow-right'
import { useCreateWallet, useLoginWithOAuth } from '@privy-io/react-auth'
import { useRouter } from '@tanstack/react-router'
import { usePostHog } from '@posthog/react'
import { navigateAfterAuth } from '@/lib/redirect'

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
    <button
      className={cn(
        'flex w-full max-w-[850px] min-h-[100px] cursor-pointer items-center justify-between rounded-[80px] bg-foreground px-10 py-[18px] md:-translate-x-20 md:min-h-0 md:px-[70px]',
      )}
      onClick={() => initOAuth({ provider: 'google' })}
    >
      <Text variant="title-80" className="min-h-0 text-background max-md:text-[32px] max-md:leading-none">
        01
      </Text>
      <Text variant="subtitle-45" className="text-background max-md:text-[20px] max-md:leading-normal max-md:min-h-0">
        Google
      </Text>
      <LongArrowRight className="[&_path]:fill-background" />
    </button>
  )
}
