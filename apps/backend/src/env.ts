import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  GITHUB_TOKEN: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().min(1),
  /** Comma-separated allowed origins for CORS and Better-Auth trusted origins */
  ALLOWED_ORIGINS: z.string().min(1),
  /** Domain used in SIWE messages — MUST match the frontend host users sign on. */
  SIWE_DOMAIN: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  PRIVY_APP_ID: z.string().min(1),
  PRIVY_APP_SECRET: z.string().min(1),
  PRIVY_VERIFICATION_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  /**
   * PgBouncer (transaction-mode) pooled connection string. Set by Heroku's
   * `pg:connection-pooling:attach`. When present it's used for runtime queries
   * so many client connections multiplex onto a few server connections;
   * migrations still run against the direct DATABASE_URL.
   */
  DATABASE_CONNECTION_POOL_URL: z.string().optional(),
  PAYLOAD_SECRET: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_ENDPOINT: z.string().min(1),
  R2_PUBLIC_URL: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
