import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'redduck-cookie-consent'

export type Consent = 'agree' | 'decline'

interface CookieConsentContextValue {
  // null = not yet decided (or not yet read on client)
  consent: Consent | null
  setConsent: (value: Consent) => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

function readStoredConsent(): Consent | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === 'agree' || v === 'decline' ? v : null
  } catch {
    return null
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  // Start null on both server and client to avoid hydration mismatch; sync from storage after mount.
  const [consent, setConsentState] = useState<Consent | null>(null)

  useEffect(() => {
    setConsentState(readStoredConsent())
  }, [])

  const setConsent = useCallback((value: Consent) => {
    setConsentState(value)
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {}
  }, [])

  return <CookieConsentContext.Provider value={{ consent, setConsent }}>{children}</CookieConsentContext.Provider>
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) throw new Error('useCookieConsent must be used inside CookieConsentProvider')
  return ctx
}
