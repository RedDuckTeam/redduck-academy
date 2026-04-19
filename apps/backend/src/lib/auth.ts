import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import * as schema from '../db/schema'
import { env } from '../env'
import { siwe } from 'better-auth/plugins'
import { verifyMessage } from 'viem'
import { db } from '../db'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  appName: 'Redduck Academy',
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false,
      },
    },
  },
  trustedOrigins: ['http://localhost:3000', 'http://localhost:3001', 'https://redduck-academy.jeleika.com'],
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      enabled: true,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    siwe({
      domain: 'localhost',
      anonymous: true,
      getNonce: async () => crypto.randomUUID(),
      verifyMessage: async ({ message, signature, address }) => {
        try {
          const isValid = await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
          })
          return isValid
        } catch {
          return false
        }
      },
    }),
  ],
})
