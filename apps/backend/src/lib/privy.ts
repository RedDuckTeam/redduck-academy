import { PrivyClient } from '@privy-io/server-auth'
import { env } from '../env'

export const privy = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET)

// Always uses the static verification key to avoid a JWKS round-trip on every request.
export const verifyPrivyToken = (token: string) =>
  privy.verifyAuthToken(token, env.PRIVY_VERIFICATION_KEY)
