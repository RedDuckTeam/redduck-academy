import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env'
import * as schema from './schema'
import { payloadSchema } from '@redduck/payload-config'

const client = postgres(env.DATABASE_URL, {
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 6,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  connection: { application_name: 'academy-backend' },
})

export const db = drizzle(client, { schema })
export const payloadDb = drizzle(client, { schema: payloadSchema })
