import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { LINKS } from '@/constants/links'
import { useCookieConsent, type Consent } from '@/lib/cookie-consent'

export function CookieBanner() {
  const { pathname } = useLocation()
  const { consent, setConsent } = useCookieConsent()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (pathname === '/sign-up') return null
  if (!mounted || consent !== null) return null

  const respond = (value: Consent) => {
    setConsent(value)
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-[360px] border border-foreground bg-background text-foreground shadow-xl md:bottom-6 md:right-6"
    >
      <div className="px-6 pt-5 pb-4">
        <Text variant="subtitle-32" element="h2" className="mb-1">
          COOKIES
        </Text>
        <Text variant="main-16" className="text-muted-foreground">
          We use cookies to gather anonymous data about site visits, helping us improve our website&apos;s
          performance. <br/> To learn more, read our{' '}
          <a
            href={LINKS.PrivacyPolicy}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Privacy Policy
          </a>
          .
        </Text>
      </div>
      <div className="grid grid-cols-2 border-t border-foreground">
        <ConsentButton variant="agree" onClick={() => respond('agree')}>
          Accept
        </ConsentButton>
        <ConsentButton variant="decline" onClick={() => respond('decline')}>
          Reject
        </ConsentButton>
      </div>
    </div>
  )
}

function ConsentButton({
  variant,
  onClick,
  children,
}: {
  variant: 'agree' | 'decline'
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cursor-pointer py-4 text-center font-inter text-[16px] leading-[20px] transition-colors',
        variant === 'agree'
          ? 'bg-primary text-primary-foreground hover:brightness-95'
          : 'bg-muted text-foreground hover:brightness-95',
      )}
    >
      {children}
    </button>
  )
}
