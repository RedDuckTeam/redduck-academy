import {
  wagmiAdapter,
  networks,
  projectId,
  metadata,
} from '@/constants/wallet-config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useEffect, useRef } from 'react'

const queryClient = new QueryClient()

export const Providers = ({ children }: { children: React.ReactNode }) => {
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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
