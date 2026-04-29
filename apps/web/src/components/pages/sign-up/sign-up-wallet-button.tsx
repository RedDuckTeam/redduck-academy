import { cn } from '@/lib/utils'
import { Text } from '../../ui/text'
import { LongArrowRight } from '../../ui/icons/long-arrow-right'
import { useLogin } from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { queryKeys } from '@/lib/query-keys'
import { getUserSettings } from '@/lib/api/user'

// After a wallet login Privy fires onComplete the moment the signature is verified, but the
// `privy-token` cookie the backend reads can take a beat to land on the API domain. If we
// navigate immediately, /dashboard mounts before the cookie is visible — useSession's query
// 401s, the cache stays empty, and the header renders the "Sign in" button until the user
// refreshes. Poll the settings endpoint until it succeeds, prime the cache, then navigate.
const SESSION_POLL_TRIES = 15
const SESSION_POLL_DELAY_MS = 200

export const SignUpWalletButton = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { login } = useLogin({
    onComplete: async () => {
      for (let attempt = 0; attempt < SESSION_POLL_TRIES; attempt++) {
        try {
          const settings = await getUserSettings()
          queryClient.setQueryData(queryKeys.user.settings(), settings)
          break
        } catch {
          if (attempt === SESSION_POLL_TRIES - 1) break
          await new Promise((resolve) => setTimeout(resolve, SESSION_POLL_DELAY_MS))
        }
      }
      await router.invalidate()
      await router.navigate({ to: '/dashboard', replace: true })
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
