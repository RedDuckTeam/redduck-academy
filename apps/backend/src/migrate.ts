import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

// Standalone migration runner used by the Heroku `release` phase. It is bundled
// (see build.mjs) so it runs from the slug without node_modules or drizzle-kit.
// Reads DATABASE_URL straight from the environment to avoid pulling in the full
// env schema (migrations only need the DB connection).
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('[migrate] DATABASE_URL is not set')
  process.exit(1)
}

// dist/migrate.js → ../drizzle (the SQL files + meta/_journal.json shipped in the slug).
const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url))

async function main() {
  // Migrations run against the direct DATABASE_URL (not the PgBouncer pooler),
  // with a single connection — DDL must not multiplex over transaction pooling.
  const client = postgres(connectionString!, {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 1,
  })
  try {
    console.log(`[migrate] applying migrations from ${migrationsFolder}`)
    await migrate(drizzle(client), { migrationsFolder })
    console.log('[migrate] complete')
  } finally {
    await client.end({ timeout: 5 })
  }
}

main().catch((err) => {
  console.error('[migrate] failed', err)
  process.exit(1)
})
