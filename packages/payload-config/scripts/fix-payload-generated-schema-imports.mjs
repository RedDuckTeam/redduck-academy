/**
 * Payload's `generate:db-schema` emits imports from `@payloadcms/db-postgres/drizzle/*`.
 * This repo uses `drizzle-orm` directly. This script rewrites the generated file.
 *
 * Always run via `yarn generate:schema` or `yarn generate` in this package — do not run
 * `payload generate:db-schema` alone, or imports will stay on @payloadcms paths.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const target = path.resolve(__dirname, '../src/payload-generated-schema.ts')

let s = fs.readFileSync(target, 'utf8')
s = s.replace(/\r\n/g, '\n')

// Side-effect import Payload sometimes emits
s = s.replace(/^import type \{\s*\} from ['"]@payloadcms\/db-postgres['"];\s*\n/gm, '')
s = s.replace(/^import type \{\s*\} from ['"]@payloadcms\/db-postgres['"]\s*\n/gm, '')

s = s.replace(
  /from ['"]@payloadcms\/db-postgres\/drizzle\/pg-core['"]/g,
  "from 'drizzle-orm/pg-core'",
)

s = s.replace(/from ['"]@payloadcms\/db-postgres\/drizzle['"]/g, "from 'drizzle-orm'")

if (s.includes('@payloadcms/db-postgres/drizzle')) {
  console.error(
    '[fix-payload-generated-schema-imports] Failed to strip @payloadcms/db-postgres/drizzle imports. Update the script regex.',
  )
  process.exit(1)
}

fs.writeFileSync(target, s)
console.log('[fix-payload-generated-schema-imports] OK: imports use drizzle-orm')
