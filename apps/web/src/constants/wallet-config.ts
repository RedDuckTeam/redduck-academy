import { type Chain, mainnet } from 'viem/chains'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { cookieStorage, createStorage } from 'wagmi'

export const projectId = '4c4c2a7f33e1d9a1294e20812d929a59'

export const metadata = {
  name: 'RedDuck Blockchain Academy',
  description: 'RedDuck Blockchain Academy',
  url: 'https://redduck.academy',
  icons: ['https://redduck.academy/favicon.ico'],
}

export const networks = [mainnet] as [Chain, ...Chain[]]

export const createWagmiAdapter = () =>
  new WagmiAdapter({
    networks,
    projectId,
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
  })
