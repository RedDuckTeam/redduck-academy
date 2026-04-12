import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useEffect, useRef, useState } from 'react'
import {
  metadata,
  networks,
  projectId,
  createWagmiAdapter,
} from '@/constants/wallet-config'
import { ThemeProvider } from '@/components/providers/theme-context'
import { TooltipProvider } from '@/components/ui/tooltip'

const queryClient = new QueryClient()

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [wagmiAdapter] = useState(() => createWagmiAdapter())
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      import('@reown/appkit/react').then(({ createAppKit }) => {
        createAppKit({
          adapters: [wagmiAdapter],
          networks,
          projectId,
          metadata,
        })
      })
    }
  }, [])

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
