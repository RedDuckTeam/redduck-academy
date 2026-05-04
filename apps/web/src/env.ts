import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_API_URL: z.string().min(1),
    VITE_APP_URL: z.string().min(1),
    VITE_CHAIN_ENV: z.enum(['development', 'production']).default('development'),
    VITE_PRIVY_APP_ID: z.string().min(1),
  },

  // @ts-expect-error - import.meta.env is not typed
  runtimeEnvStrict: import.meta.env,
})
