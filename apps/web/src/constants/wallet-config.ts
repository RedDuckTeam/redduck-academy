import { http, cookieStorage, createStorage, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { activeChain } from './chain'

export const wagmiConfig = createConfig({
  chains: [activeChain],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  connectors: [injected()],
  transports: {
    [activeChain.id]: http(),
  },
})
