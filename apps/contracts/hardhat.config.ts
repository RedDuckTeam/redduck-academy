import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem';
import { defineConfig } from 'hardhat/config';


import { env } from './config/env.js';
import {
  getForkNetworkConfig,
  getHardhatNetworkConfig,
  getNetworkConfig,
} from './config/networks.js';

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],

  solidity: {
    profiles: {
      default: {
        version: '0.8.28',
      },
      production: {
        version: '0.8.28',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },

  networks: {
    main: getNetworkConfig('main'),
    sepolia: getNetworkConfig('sepolia'),
    localhost: getNetworkConfig('localhost'),
    hardhat: env.FORKING_NETWORK
      ? getForkNetworkConfig(env.FORKING_NETWORK)
      : getHardhatNetworkConfig(),
  },

  verify: {
    etherscan: env.ETHERSCAN_API_KEY
      ? { apiKey: env.ETHERSCAN_API_KEY, enabled: true }
      : { enabled: false },
  },
});
