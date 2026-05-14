import { useEffect } from 'react'
import { usePostHog } from '@posthog/react'
import { useCookieConsent } from '@/lib/cookie-consent'

export function PostHogConsentBridge() {
  const posthog = usePostHog()
  const { consent } = useCookieConsent()

  useEffect(() => {
    if (!posthog) return
    if (consent === 'agree') {
      posthog.opt_in_capturing()
    } else if (consent === 'decline') {
      posthog.opt_out_capturing()
    }
  }, [consent, posthog])

  return null
}
