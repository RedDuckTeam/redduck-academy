import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/providers/theme-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PrivyProvider } from '@privy-io/react-auth'
import { PrivyAuthContext } from './privy-auth-context'
import { usePrivy } from '@privy-io/react-auth'
import { env } from '@/env'

const queryClient = new QueryClient()

function PrivyAuthBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout } = usePrivy()
  return <PrivyAuthContext.Provider value={{ ready, authenticated, logout }}>{children}</PrivyAuthContext.Provider>
}

export const Providers = ({ children }: { children: React.ReactNode }) => {
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
