import { sepolia, mainnet } from 'viem/chains'
import { env } from '@/env'
import { certificateContractAddresses } from './addresses'

export const activeChain = env.VITE_CHAIN_ENV === 'production' ? mainnet : sepolia

export const certificateContractAddress =
  activeChain.id === mainnet.id
    ? certificateContractAddresses.mainnet
    : certificateContractAddresses.sepolia
