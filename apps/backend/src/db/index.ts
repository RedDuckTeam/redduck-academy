import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env'
import * as schema from './schema'
import { payloadSchema } from '@redduck/payload-config'

const client = postgres(env.DATABASE_URL, { ssl: { rejectUnauthorized: false } })

export const db = drizzle(client, { schema })
export const payloadDb = drizzle(client, { schema: payloadSchema })
