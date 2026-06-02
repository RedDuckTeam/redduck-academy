import { useEffect } from 'react'
import { usePostHog } from '@posthog/react'
import { useCookieConsent } from '@/lib/cookie-consent'

export function PostHogConsentBridge() {
  const posthog = usePostHog()
  const { consent } = useCookieConsent()

  useEffect(() => {
    if (!posthog) return
    // TEMP(debug): capturing forced ON for ALL users to trace an error — this BYPASSES cookie
    // consent. REVERT after debugging by restoring the consent-gated block:
    //   if (consent === 'agree') posthog.opt_in_capturing()
    //   else posthog.opt_out_capturing() // 'decline' or null → stop capturing
    posthog.opt_in_capturing()
  }, [consent, posthog])

  return null
}
