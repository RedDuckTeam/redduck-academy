import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'redduck-cookie-consent'

type Consent = 'agree' | 'decline'

export function CookieBanner() {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== 'agree' && stored !== 'decline') setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  if (pathname === '/sign-up') return null
  if (!visible) return null

  const respond = (value: Consent) => {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {}
    setVisible(false)
  }

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-40 bg-black/50" />
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
          We use cookies to make your experience better.
        </Text>
      </div>
      <div className="grid grid-cols-2 border-t border-foreground">
        <ConsentButton variant="agree" onClick={() => respond('agree')}>
          Agree
        </ConsentButton>
        <ConsentButton variant="decline" onClick={() => respond('decline')}>
          Decline
        </ConsentButton>
      </div>
      </div>
    </>
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
