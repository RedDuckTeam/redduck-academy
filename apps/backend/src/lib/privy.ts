import { PrivyClient } from '@privy-io/server-auth'
import { env } from '../env'

export const privy = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET)

// Heroku config vars strip real newlines — if the key was pasted with literal "\n"
// sequences, convert them back so jose's importSPKI gets valid PEM.
const verificationKey = env.PRIVY_VERIFICATION_KEY.replace(/\\n/g, '\n')

// Always uses the static verification key to avoid a JWKS round-trip on every request.
export const verifyPrivyToken = (token: string) => privy.verifyAuthToken(token, verificationKey)
