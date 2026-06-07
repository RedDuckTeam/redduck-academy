import { useCallback, useLayoutEffect, useState } from 'react'
import { PrivyProvider, usePrivy } from '@privy-io/react-auth'
import { PrivyAuthContext } from './privy-auth-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { env } from '@/env'
import { setAuthTokenGetter } from '@/lib/api/auth-token'

/**
 * localStorage keys Privy writes once a user has an authenticated session.
 * Their presence means this is a returning logged-in user, so we mount Privy
 * eagerly to restore them. First-time visitors have none of these, so Privy
 * never loads for them — no SDK init, no crash surface. See RESILIENCE-AUDIT → C3.
 */
const PRIVY_SESSION_KEYS = ['privy:token', 'privy:refresh_token', 'privy:id_token']

function hasStoredPrivySession(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return PRIVY_SESSION_KEYS.some((key) => {
      const value = window.localStorage.getItem(key)
      return value != null && value !== '' && value !== 'null'
    })
  } catch {
    // localStorage can throw (private mode / disabled cookies) — treat as no session.
    return false
  }
}

function PrivyAuthBridge({ children, requestPrivy }: { children: React.ReactNode; requestPrivy: () => void }) {
  const { ready, authenticated, logout, getAccessToken } = usePrivy()

  // Make Privy's getAccessToken reachable from the plain-TS Fetcher. useLayoutEffect so the
  // getter is set before any child component's effects fire queries on mount.
  useLayoutEffect(() => {
    setAuthTokenGetter(getAccessToken)
    return () => setAuthTokenGetter(null)
  }, [getAccessToken])

  return (
    <PrivyAuthContext.Provider value={{ ready, authenticated, logout, enabled: true, requestPrivy }}>
      {children}
    </PrivyAuthContext.Provider>
  )
}

/**
 * Lazily mounts the Privy SDK. The provider is only rendered for returning
 * logged-in users (detected synchronously via a stored session token, so there's
 * no post-mount flip / app remount for them) or once something calls
 * `requestPrivy` (e.g. the sign-up page). Until then — and if Privy ever crashes
 * on init — children render with a logged-out context so the app stays fully
 * usable instead of white-screening.
 */
export function LazyPrivyProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState<boolean>(hasStoredPrivySession)
  const requestPrivy = useCallback(() => setEnabled(true), [])

  // Used both before Privy mounts and as the crash fallback.
  const withoutPrivy = (
    <PrivyAuthContext.Provider
      value={{ ready: true, authenticated: false, logout: async () => {}, enabled: false, requestPrivy }}
    >
      {children}
    </PrivyAuthContext.Provider>
  )

  if (!enabled) return withoutPrivy

  return (
    <ErrorBoundary fallback={withoutPrivy} onError={(error) => console.error('Privy provider crashed:', error)}>
      <PrivyProvider
        appId={env.VITE_PRIVY_APP_ID}
        config={{
          loginMethods: ['google', 'wallet'],
          appearance: { theme: 'dark' },
        }}
      >
        <PrivyAuthBridge requestPrivy={requestPrivy}>{children}</PrivyAuthBridge>
      </PrivyProvider>
    </ErrorBoundary>
  )
}
