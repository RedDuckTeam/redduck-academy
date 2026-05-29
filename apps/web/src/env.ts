import { createEnv } from '@t3-oss/env-core'
import { clientEnvSchema, clientPrefix } from './env-schema'

export const env = createEnv({
  clientPrefix,
  client: clientEnvSchema,

  // @ts-expect-error - import.meta.env is not typed
  runtimeEnvStrict: import.meta.env,
})
