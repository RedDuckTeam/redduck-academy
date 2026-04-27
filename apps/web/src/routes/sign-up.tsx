import { createFileRoute, redirect } from '@tanstack/react-router'
import Marquee from 'react-fast-marquee'
import { WagmiProvider } from 'wagmi'
import { ThemeToggle } from '@/components/header/theme-toggle'
import { SignUpGoogleButton } from '@/components/pages/sign-up/sign-up-google-button'
import { SignUpStartText } from '@/components/pages/sign-up/sign-up-start-text'
import { SignUpWalletButton } from '@/components/pages/sign-up/sign-up-wallet-button'
import { DuckIcon } from '@/components/ui/icons/duck'
import { Text } from '@/components/ui/text'
import { wagmiConfig } from '@/constants/wallet-config'
import { usePrivyAuth } from '@/components/providers/privy-auth-context'
import { queryKeys } from '@/lib/query-keys'
import { useEffect } from 'react'

const MARQUEE_LABELS = ['DeFi', 'Rebase tokens', 'DEX', 'Synthetic tokens', 'DeFi'] as const

/** Repeated so the strip reads as one long loop; autoFill also clones to cover ultra-wide viewports. */
const MARQUEE_ITEMS = [...MARQUEE_LABELS, ...MARQUEE_LABELS, ...MARQUEE_LABELS] as const

export const Route = createFileRoute('/sign-up')({
  ssr: false,
  beforeLoad: ({ context: { queryClient } }) => {
    const session = queryClient.getQueryData(queryKeys.user.settings())
    if (session) throw redirect({ to: '/dashboard' })
  },
  component: SignUp,
})

function SignUp() {
  const { ready, authenticated } = usePrivyAuth()

  useEffect(() => {
    if (ready && authenticated) {
      window.location.replace('/dashboard')
    }
  }, [ready, authenticated])

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
            <SignUpGoogleButton />
            <SignUpWalletButton />
          </div>
          <SignUpStartText />
        </div>
        <div className="overflow-hidden bg-foreground py-3">
          <Marquee autoFill speed={45} gradient={false} pauseOnHover>
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
