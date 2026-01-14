import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '../db'
import * as schema from '../db/schema'
import { getEnvFromContext } from '../env'
import { Context } from 'hono'

export const auth = (c: Context) => {
  const env = getEnvFromContext(c)

  return betterAuth({
    database: drizzleAdapter(getDb(c), { provider: 'pg', schema }),
    appName: 'Redduck Academy',
    trustedOrigins: ['http://localhost:3000', 'http://localhost:8787'],
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        enabled: true,
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  })
}
