import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import * as schema from '../db/schema'
import { env } from '../env'
import { siwe } from 'better-auth/plugins'
import { verifyMessage } from 'viem'
import { db } from '../db'
import { user as userTable } from '../db/auth-schema'
import { eq } from 'drizzle-orm'

const generateUsername = () => `user${Math.floor(10000000 + Math.random() * 90000000)}`

const generateUniqueUsername = async (): Promise<string> => {
  for (let i = 0; i < 10; i++) {
    const candidate = generateUsername()
    const [existing] = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.username, candidate)).limit(1)
    if (!existing) return candidate
  }
  return generateUsername()
}

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
      username: {
        type: 'string',
        input: false,
      },
      blacklisted: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          const username = await generateUniqueUsername()
          await db.update(userTable).set({ username }).where(eq(userTable.id, createdUser.id))
        },
      },
    },
  },
  trustedOrigins: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
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
      domain: env.SIWE_DOMAIN,
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
