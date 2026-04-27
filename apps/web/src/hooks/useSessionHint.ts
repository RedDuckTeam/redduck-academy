import { useSyncExternalStore } from 'react'

const PRIVY_KEYS = ['privy:token', 'privy:refresh_token']

const readPrivySessionHint = () => {
  if (typeof window === 'undefined') return false
  try {
    return PRIVY_KEYS.some((k) => window.localStorage.getItem(k) !== null)
  } catch {
    return false
  }
}

const subscribe = (onChange: () => void) => {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

// Returns true if Privy currently has a persisted session in localStorage.
// Lets us skip the loading placeholder for visitors who have never logged in,
// and detect logged-out users synchronously before Privy finishes initializing.
export const useSessionHint = () =>
  useSyncExternalStore(
    subscribe,
    readPrivySessionHint,
    () => false,
  )
