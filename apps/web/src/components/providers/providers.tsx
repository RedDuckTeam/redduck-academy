import { useLayoutEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/providers/theme-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PrivyProvider } from '@privy-io/react-auth'
import { PrivyAuthContext } from './privy-auth-context'
import { usePrivy } from '@privy-io/react-auth'
import { env } from '@/env'
import { setAuthTokenGetter } from '@/lib/api/auth-token'

function PrivyAuthBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout, getAccessToken } = usePrivy()

  // Make Privy's getAccessToken reachable from the plain-TS Fetcher. useLayoutEffect so the
  // getter is set before any child component's effects fire queries on mount.
  useLayoutEffect(() => {
    setAuthTokenGetter(getAccessToken)
    return () => setAuthTokenGetter(null)
  }, [getAccessToken])

  return <PrivyAuthContext.Provider value={{ ready, authenticated, logout }}>{children}</PrivyAuthContext.Provider>
}

export const Providers = ({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) => {
  return (
    <PrivyProvider
      appId={env.VITE_PRIVY_APP_ID}
      config={{
        loginMethods: ['google', 'wallet'],
        appearance: { theme: 'dark' },
      }}
    >
      <PrivyAuthBridge>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PrivyAuthBridge>
    </PrivyProvider>
  )
}
