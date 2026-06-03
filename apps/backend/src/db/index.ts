import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env'
import * as schema from './schema'
import { payloadSchema } from '@redduck/payload-config'

// Prefer the PgBouncer pooled URL when available so we don't exhaust the
// Postgres connection limit; fall back to the direct URL otherwise.
const usingPooler = Boolean(env.DATABASE_CONNECTION_POOL_URL)
const connectionString = env.DATABASE_CONNECTION_POOL_URL ?? env.DATABASE_URL

export const client = postgres(connectionString, {
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  // Kept low: this DB has a ~20-connection ceiling shared with the admin pool,
  // and Heroku deploys briefly run old + new dynos at once (doubling the count).
  max: 3,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  // PgBouncer transaction pooling doesn't support server-side prepared
  // statements, so disable them when routing through the pooler.
  prepare: !usingPooler,
  connection: { application_name: 'academy-backend' },
})

export const db = drizzle(client, { schema })
export const payloadDb = drizzle(client, { schema: payloadSchema })
