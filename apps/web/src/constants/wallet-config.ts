import { mainnet } from 'viem/chains'
import { createConfig, http, cookieStorage, createStorage } from 'wagmi'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [mainnet],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
  },
})
