// Inserts new course/module/lesson rows into the Payload Postgres database, using the
// `id` each content file already declares. Runs on merge to main (and manually).
//
//   DATABASE_URL=... npx tsx scripts/sync-content-db.ts [--dry-run]
//
// Design:
//   • INSERT-ONLY. Never updates or deletes an existing row — a removed file must never
//     drop a DB row that may hold user progress, and edits to prose live in the files.
//   • Idempotent. "New" means an id present in the files but not yet in the DB, so it is
//     safe to re-run: a second run inserts nothing.
//   • File ids are the source of truth. They live in the reserved [1e9, 2e9) band (see
//     scripts/new-id.mjs), permanently above the CMS's low auto-increment sequence, so
//     inserting an explicit id never collides with a CMS-generated one and the sequence
//     is deliberately left untouched (no setval).
//   • Only structural columns are written (title, slug, parent, order, type). The lesson
//     body stays in the files; `content` is left null. Assessment data for non-lecture
//     lessons is authored in the CMS, so new lessons must be `type: lecture`.

import { readFile, readdir } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import yaml from 'yaml'
import { payloadSchema } from '@redduck/payload-config'

const { courses, modules, lessons } = payloadSchema

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'content')
const DRY_RUN = process.argv.includes('--dry-run')
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const LESSON_TYPES = ['lecture', 'test', 'coding_task', 'review_task']

type Meta = Record<string, unknown>
interface CourseRow { id: number; slug: string; title: string; description: string; order: number; isHidden: boolean }
interface ModuleRow { id: number; slug: string; title: string; courseId: number; order: number; isHidden: boolean }
interface LessonRow { id: number; slug: string; title: string; moduleId: number; order: number; type: string; isHidden: boolean }

function intId(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null
}

async function subdirs(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const e of await readdir(dir, { withFileTypes: true })) if (e.isDirectory()) out.push(join(dir, e.name))
  return out.sort()
}

async function readMeta(abs: string): Promise<{ data: Meta; body: string }> {
  const raw = await readFile(abs, 'utf8')
  const m = raw.match(FRONTMATTER)
  if (!m) return { data: {}, body: raw }
  return { data: (yaml.parse(m[1]) ?? {}) as Meta, body: raw.slice(m[0].length) }
}

// Walk content/ into flat course/module/lesson lists. Missing or invalid ids are collected
// as errors — every file that should map to a DB row must carry one.
async function readContent() {
  const cs: CourseRow[] = []
  const ms: ModuleRow[] = []
  const ls: LessonRow[] = []
  const errors: string[] = []
  const rel = (abs: string) => abs.slice(ROOT.length + 1)

  for (const courseDir of await subdirs(CONTENT)) {
    const courseSlug = basename(courseDir)
    const courseFile = join(courseDir, '_course.md')
    let cm: { data: Meta; body: string }
    try {
      cm = await readMeta(courseFile)
    } catch {
      continue // not a course directory
    }
    const courseId = intId(cm.data.id)
    if (!courseId) errors.push(`${rel(courseFile)}: missing or invalid id (run \`node scripts/new-id.mjs\`)`)
    cs.push({
      id: courseId ?? -1,
      slug: courseSlug,
      title: String(cm.data.title ?? courseSlug),
      description: cm.body.trim(),
      order: Number(cm.data.order ?? 0),
      isHidden: cm.data.isHidden === true,
    })

    for (const moduleDir of await subdirs(courseDir)) {
      const moduleSlug = basename(moduleDir)
      const moduleFile = join(moduleDir, '_module.md')
      let mm: { data: Meta; body: string }
      try {
        mm = await readMeta(moduleFile)
      } catch {
        continue
      }
      const moduleId = intId(mm.data.id)
      if (!moduleId) errors.push(`${rel(moduleFile)}: missing or invalid id (run \`node scripts/new-id.mjs\`)`)
      ms.push({
        id: moduleId ?? -1,
        slug: moduleSlug,
        title: String(mm.data.title ?? moduleSlug),
        courseId: courseId ?? -1,
        order: Number(mm.data.order ?? 0),
        isHidden: mm.data.isHidden === true,
      })

      for (const e of await readdir(moduleDir, { withFileTypes: true })) {
        if (!e.isFile() || !e.name.endsWith('.md') || e.name.startsWith('_')) continue
        const lessonFile = join(moduleDir, e.name)
        const lm = await readMeta(lessonFile)
        const lessonId = intId(lm.data.id)
        if (!lessonId) errors.push(`${rel(lessonFile)}: missing or invalid id (run \`node scripts/new-id.mjs\`)`)
        const type = String(lm.data.type ?? 'lecture')
        if (!LESSON_TYPES.includes(type)) errors.push(`${rel(lessonFile)}: unknown type "${type}"`)
        ls.push({
          id: lessonId ?? -1,
          slug: basename(e.name, '.md'),
          title: String(lm.data.title ?? ''),
          moduleId: moduleId ?? -1,
          order: Number(lm.data.order ?? 0),
          type,
          isHidden: lm.data.isHidden === true,
        })
      }
    }
  }
  return { cs, ms, ls, errors }
}

function fail(message: string, details: string[] = []): never {
  console.error(`\n✗ ${message}`)
  for (const d of details) console.error(`  - ${d}`)
  process.exit(1)
}

async function main() {
  const connectionString = process.env.DATABASE_CONNECTION_POOL_URL || process.env.DATABASE_URL
  if (!connectionString) fail('DATABASE_URL is not set.')

  const { cs, ms, ls, errors } = await readContent()
  if (errors.length) fail('Content has files that cannot be synced:', errors)

  // Local socket / localhost connections skip TLS; managed Postgres (prod) uses it.
  const isLocal = /^postgres(ql)?:\/\/\//.test(connectionString) || /localhost|127\.0\.0\.1|host=\//.test(connectionString)
  const sql = postgres(connectionString, {
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 1,
    prepare: !process.env.DATABASE_CONNECTION_POOL_URL,
  })
  const db = drizzle(sql, { schema: payloadSchema })

  try {
    const [haveCourses, haveModules, haveLessons] = await Promise.all([
      db.select({ id: courses.id }).from(courses),
      db.select({ id: modules.id }).from(modules),
      db.select({ id: lessons.id }).from(lessons),
    ])
    const courseIds = new Set(haveCourses.map((r) => r.id))
    const moduleIds = new Set(haveModules.map((r) => r.id))
    const lessonIds = new Set(haveLessons.map((r) => r.id))

    const newCourses = cs.filter((c) => !courseIds.has(c.id))
    const newModules = ms.filter((m) => !moduleIds.has(m.id))
    const newLessons = ls.filter((l) => !lessonIds.has(l.id))

    // Referential + rule checks before touching the DB.
    const refErrors: string[] = []
    const willHaveCourse = (id: number) => courseIds.has(id) || newCourses.some((c) => c.id === id)
    const willHaveModule = (id: number) => moduleIds.has(id) || newModules.some((m) => m.id === id)
    for (const m of newModules) if (!willHaveCourse(m.courseId)) refErrors.push(`module ${m.slug} (id ${m.id}): course id ${m.courseId} not found`)
    for (const l of newLessons) {
      if (!willHaveModule(l.moduleId)) refErrors.push(`lesson ${l.slug} (id ${l.id}): module id ${l.moduleId} not found`)
      if (l.type !== 'lecture') refErrors.push(`lesson ${l.slug} (id ${l.id}): new lessons must be type "lecture", got "${l.type}"`)
    }
    if (refErrors.length) fail('Cannot insert new rows:', refErrors)

    const total = newCourses.length + newModules.length + newLessons.length
    if (total === 0) {
      console.log('✓ Database is in sync with the content files — nothing to insert.')
      return
    }

    console.log(`${DRY_RUN ? '[dry run] would insert' : 'Inserting'} ${total} new row(s):`)
    for (const c of newCourses) console.log(`  course  ${c.id}  ${c.slug}`)
    for (const m of newModules) console.log(`  module  ${m.id}  ${m.slug}  (course ${m.courseId})`)
    for (const l of newLessons) console.log(`  lesson  ${l.id}  ${l.slug}  (module ${l.moduleId})`)

    if (DRY_RUN) {
      console.log('\n[dry run] no changes written.')
      return
    }

    await db.transaction(async (tx) => {
      if (newCourses.length)
        await tx.insert(courses).values(
          newCourses.map((c) => ({ id: c.id, title: c.title, slug: c.slug, description: c.description || null, order: c.order, isHidden: c.isHidden })),
        )
      if (newModules.length)
        await tx.insert(modules).values(
          newModules.map((m) => ({ id: m.id, title: m.title, slug: m.slug, course: m.courseId, order: m.order, isHidden: m.isHidden })),
        )
      if (newLessons.length)
        await tx.insert(lessons).values(
          newLessons.map((l) => ({ id: l.id, title: l.title, slug: l.slug, module: l.moduleId, order: l.order, type: l.type as 'lecture', isHidden: l.isHidden })),
        )
    })

    console.log(`\n✓ Inserted ${total} row(s).`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
