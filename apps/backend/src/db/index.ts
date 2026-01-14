import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import type { Context } from 'hono'
import { getEnvFromContext } from '../env'
import * as schema from './schema'

export function getDb(c: Context) {
  const env = getEnvFromContext(c)
  const client = postgres(env.DATABASE_URL)
  const drizzleDB = drizzle(client, { schema })
  return drizzleDB
}
