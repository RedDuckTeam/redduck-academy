import { z } from 'zod';
import { createEnv } from './create-env';
import { networksEnum } from './types';

try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch { /* no .env file */ }

export const env = createEnv({
  server: {
    INFURA_KEY: z.string().optional(),
    MNEMONIC_DEV: z.string().optional(),
    MNEMONIC_PROD: z.string().optional(),
    FORKING_NETWORK: networksEnum.optional(),
    ETHERSCAN_API_KEY: z.string().optional(),
  },
  runtimeEnv: {
    INFURA_KEY: process.env.INFURA_KEY,
    MNEMONIC_DEV: process.env.MNEMONIC_DEV,
    MNEMONIC_PROD: process.env.MNEMONIC_PROD,
    FORKING_NETWORK: process.env.FORKING_NETWORK,
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  },
  isServer: true,
});
