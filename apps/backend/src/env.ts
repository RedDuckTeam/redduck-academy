import { z } from 'zod'
import type { Context } from 'hono'
import { env } from 'hono/adapter'

const envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>

export function getEnvFromContext(c: Context): Env {
  const rawEnv = env(c)

  const result = envSchema.safeParse(rawEnv)

  if (!result.success) {
    throw result.error
  }

  return result.data
}
