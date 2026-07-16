import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import Marquee from 'react-fast-marquee'
import { WagmiProvider } from 'wagmi'
import { ThemeToggle } from '@/components/header/theme-toggle'
import { SignUpGoogleButton } from '@/components/pages/sign-up/sign-up-google-button'
import { SignUpOptionButton } from '@/components/pages/sign-up/sign-up-option-button'
import { SignUpStartText } from '@/components/pages/sign-up/sign-up-start-text'
import { SignUpWalletButton } from '@/components/pages/sign-up/sign-up-wallet-button'
import { DuckIcon } from '@/components/ui/icons/duck'
import { Text } from '@/components/ui/text'
import { wagmiConfig } from '@/constants/wallet-config'
import { queryKeys } from '@/lib/query-keys'
import { useSession } from '@/hooks/useSession'
import { usePrivyAuth } from '@/components/providers/privy-auth-context'
import { createPageMeta } from '@/lib/seo'
import { navigateAfterAuth, peekRedirect, sanitizeRedirect } from '@/lib/redirect'
import { useEffect, useMemo } from 'react'

const MARQUEE_LABELS = ['DeFi', 'Rebase tokens', 'DEX', 'Synthetic tokens', 'DeFi'] as const

/** Repeated so the strip reads as one long loop; autoFill also clones to cover ultra-wide viewports. */
const MARQUEE_ITEMS = [...MARQUEE_LABELS, ...MARQUEE_LABELS, ...MARQUEE_LABELS] as const

export const Route = createFileRoute('/sign-up')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const target = sanitizeRedirect(search.redirect)
    return target ? { redirect: target } : {}
  },
  beforeLoad: ({ context: { queryClient }, search }) => {
    const session = queryClient.getQueryData(queryKeys.user.settings())
    // Logged-in users skip the page. When a redirect is present we let the
    // component mount and `navigateAfterAuth` send them on (it handles arbitrary
    // paths); otherwise bounce straight to the home page.
    if (session && !search.redirect) throw redirect({ to: '/' })
  },
  head: () =>
    createPageMeta({
      title: 'Sign in',
      description:
        'Sign in to RedDuck Academy to start learning blockchain development. Track your progress, earn certificates, and join the community.',
      path: '/sign-up',
    }),
  component: SignUp,
})

function SignUp() {
  const { session } = useSession()
  const { enabled, ready, requestPrivy } = usePrivyAuth()
  const router = useRouter()
  const search = Route.useSearch()
  // New CTAs carry the post-login target in sessionStorage (no crawlable ?redirect= param); the
  // legacy search param is still honored for any old links. Resolved synchronously so the login
  // buttons capture the right target on first render.
  const redirectTo = useMemo(() => search.redirect ?? peekRedirect(), [search.redirect])

  // Privy is no longer mounted globally — this is the login entry point, so ask
  // for it here. The login buttons call Privy hooks directly, so they can only
  // render once the SDK is mounted (`enabled`) and initialised (`ready`).
  useEffect(() => {
    requestPrivy()
  }, [requestPrivy])
  const privyReady = enabled && ready

  // If a session is already present when this page mounts (e.g. user revisits /sign-up
  // while logged in, or a redirect kept them here), send them on. The login buttons
  // handle their own post-login navigation.
  useEffect(() => {
    if (!session?.user) return
    navigateAfterAuth(router, redirectTo)
  }, [session, router, redirectTo])

  return (
    <WagmiProvider config={wagmiConfig}>
      <main className="flex flex-col min-h-screen bg-background text-foreground">
        <div className="relative flex flex-1 flex-col overflow-hidden px-5 pt-20 pb-0 md:p-[60px]">
          <div className="absolute right-5 top-5 z-10 xl:right-[180px] lg:top-[60px]">
            <ThemeToggle />
          </div>
          <div>
            <Text
              variant="title-80"
              className="min-h-0 text-center text-[26px] leading-normal md:min-h-[96px] md:text-left md:text-[80px] md:leading-[96px]"
            >
              _REGISTER ON COURSE
            </Text>
          </div>
          <div className="mx-auto flex h-full w-full md:max-w-[calc(100%-80px)] lg:max-w-[850px] flex-1 flex-col items-center justify-center gap-4 md:gap-5">
            {privyReady ? (
              <>
                <SignUpGoogleButton redirect={redirectTo} />
                <SignUpWalletButton redirect={redirectTo} />
              </>
            ) : (
              <>
                <SignUpOptionButton number="01" label="Google" className="md:-translate-x-20" disabled />
                <SignUpOptionButton number="02" label="WEB3 WALLET" className="md:translate-x-20" disabled />
              </>
            )}
          </div>
          <SignUpStartText />
        </div>
        <div className="overflow-hidden bg-foreground py-3">
          <Marquee autoFill speed={45} gradient={false}>
            {MARQUEE_ITEMS.map((label, index) => (
              <span key={`${label}-${index}`} className="mx-6 inline-flex md:mx-10">
                <Text variant="caps-20" className="text-nowrap text-background">
                  {label}
                </Text>
              </span>
            ))}
          </Marquee>
        </div>
        <div className="flex items-center justify-between px-5 py-10 md:px-[60px] md:pb-[60px] md:pt-[27px]">
          <div className="flex flex-col">
            <Text
              variant="caps-24"
              className="text-[16px] leading-5 min-h-0 uppercase md:min-h-[30px] md:text-[24px] md:leading-[30px]"
            >
              redduck
            </Text>
            <Text
              variant="caps-24"
              className="text-[16px] leading-5 min-h-0 uppercase md:min-h-[30px] md:text-[24px] md:leading-[30px]"
            >
              blockchain
            </Text>
            <Text
              variant="caps-24"
              className="text-[16px] leading-5 min-h-0 uppercase md:min-h-[30px] md:text-[24px] md:leading-[30px]"
            >
              academy
            </Text>
          </div>
          <div className="flex size-[clamp(2.75rem,10vw,5.625rem)] shrink-0 items-center justify-center bg-primary p-1.5 sm:p-2">
            <DuckIcon className="h-auto w-[72%] max-w-[48px] sm:max-w-[52px] md:max-w-[54px]" />
          </div>
        </div>
      </main>
    </WagmiProvider>
  )
}
