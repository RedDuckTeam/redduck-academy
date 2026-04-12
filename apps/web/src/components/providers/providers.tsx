import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { ThemeProvider } from '@/components/providers/theme-context'
import { TooltipProvider } from '@/components/ui/tooltip'

const queryClient = new QueryClient()

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [WagmiProvider, setWagmiProvider] = useState<React.ComponentType<{
    config: unknown
    children: React.ReactNode
  }> | null>(null)
  const [wagmiConfig, setWagmiConfig] = useState<unknown>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    Promise.all([
      import('wagmi'),
      import('@/constants/wallet-config'),
    ]).then(([{ WagmiProvider }, { createWagmiAdapter, metadata, networks, projectId }]) => {
      const adapter = createWagmiAdapter()
      setWagmiConfig(adapter.wagmiConfig)
      setWagmiProvider(() => WagmiProvider)

      import('@reown/appkit/react').then(({ createAppKit }) => {
        createAppKit({ adapters: [adapter], networks, projectId, metadata })
      })
    })
  }, [])

  const content = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )

  if (!WagmiProvider || !wagmiConfig) {
    return content
  }

  return <WagmiProvider config={wagmiConfig}>{content}</WagmiProvider>
}
