import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env'
import * as schema from './schema'
import { payloadSchema } from '@redduck/payload-config'

const client = postgres(env.DATABASE_URL)

// @ts-expect-error - connection is not supported in drizzle-orm
export const db = drizzle(client, { schema, connection: { ssl: { rejectUnauthorized: false } } })
// @ts-expect-error - connection is not supported in drizzle-orm
export const payloadDb = drizzle(client, { schema: payloadSchema, connection: { ssl: { rejectUnauthorized: false } } })
