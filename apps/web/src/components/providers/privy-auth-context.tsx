import { createContext, useContext } from 'react'

interface PrivyAuthState {
  ready: boolean
  authenticated: boolean
  logout: () => Promise<void>
}

export const PrivyAuthContext = createContext<PrivyAuthState>({
  ready: false,
  authenticated: false,
  logout: async () => {},
})

export const usePrivyAuth = () => useContext(PrivyAuthContext)
