import { createContext, useContext } from 'react'

interface PrivyAuthState {
  ready: boolean
  authenticated: boolean
  logout: () => Promise<void>
  enabled: boolean
  requestPrivy: () => void
}

export const PrivyAuthContext = createContext<PrivyAuthState>({
  ready: false,
  authenticated: false,
  logout: async () => {},
  enabled: false,
  requestPrivy: () => {},
})

export const usePrivyAuth = () => useContext(PrivyAuthContext)
