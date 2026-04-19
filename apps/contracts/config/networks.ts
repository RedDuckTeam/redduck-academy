import type {
  EdrNetworkUserConfig,
  HttpNetworkUserConfig,
} from 'hardhat/types/config';

import type { Network, NetworkConfigParam, RpcUrl } from './types';
import { env } from './env';

const { INFURA_KEY, MNEMONIC_DEV, MNEMONIC_PROD } = env;

export const rpcUrls: NetworkConfigParam<RpcUrl> = {
  main: `https://mainnet.infura.io/v3/${INFURA_KEY ?? ''}`,
  sepolia: `https://sepolia.infura.io/v3/${INFURA_KEY ?? ''}`,
  hardhat: 'http://localhost:8545',
  localhost: 'http://localhost:8545',
};

export const chainIds: NetworkConfigParam<number> = {
  main: 1,
  sepolia: 11155111,
  hardhat: 31337,
  localhost: 31337,
};

const mnemonics: NetworkConfigParam<string | undefined> = {
  main: MNEMONIC_PROD,
  sepolia: MNEMONIC_DEV,
  hardhat: MNEMONIC_DEV,
  localhost: MNEMONIC_DEV,
};

const forkingBlocks: NetworkConfigParam<number | undefined> = {
  main: 19647878,
  sepolia: undefined,
  hardhat: undefined,
  localhost: undefined,
};

export const getNetworkConfig = (network: Extract<Network, 'main' | 'sepolia' | 'localhost'>): HttpNetworkUserConfig => ({
  type: 'http',
  chainType: 'l1',
  chainId: chainIds[network],
  url: rpcUrls[network],
  accounts: mnemonics[network] ? { mnemonic: mnemonics[network]! } : undefined,
});

export const getForkNetworkConfig = (network: Network): EdrNetworkUserConfig => ({
  type: 'edr-simulated',
  chainType: 'l1',
  chainId: chainIds.hardhat,
  accounts: mnemonics[network] ? { mnemonic: mnemonics[network]! } : undefined,
  forking: {
    url: rpcUrls[network],
    blockNumber: forkingBlocks[network],
    enabled: true,
  },
});

export const getHardhatNetworkConfig = (): EdrNetworkUserConfig => ({
  type: 'edr-simulated',
  chainType: 'l1',
  chainId: chainIds.hardhat,
  accounts: mnemonics.hardhat ? { mnemonic: mnemonics.hardhat } : undefined,
});
