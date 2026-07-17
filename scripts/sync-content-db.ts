// Inserts new course/module/lesson rows into the Payload Postgres database. Runs on merge to
// main (and manually).
//
//   DATABASE_URL=... npx tsx scripts/sync-content-db.ts [--dry-run]
//   npx tsx scripts/sync-content-db.ts --assign-ids   # write ids into files only, no DB
//
// Design:
//   • INSERT + isHidden. Never deletes a row, and the only column it updates on an existing row
//     is `isHidden` — visibility carries no user data, so a file can hide/reveal a course, module,
//     or lesson. A removed file must never drop a DB row that may hold user progress, and edits to
//     prose live in the files.
//   • Idempotent. "New" means an id present in the files but not yet in the DB, so it is
//     safe to re-run: a second run inserts nothing.
//   • File ids are the source of truth. They live in the reserved [1e9, 2e9) band,
//     permanently above the CMS's low auto-increment sequence, so inserting an explicit
//     id never collides with a CMS-generated one and the sequence
//     is deliberately left untouched (no setval). An id-less file gets one assigned and
//     written back to its frontmatter (persisted before the DB write, so a re-run never
//     mints a second id for the same file). The merge workflow commits those ids.
//   • Only structural columns are written (title, slug, parent, order, type). The lesson
//     body stays in the files; `content` is left null. New lessons must be `type: lecture`
//     or `test` (a test's questions are synced separately by scripts/sync-tests.mjs);
//     coding_task / review_task assessment data is still authored in the CMS.

import { readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import yaml from 'yaml'
import { payloadSchema } from '@redduck/payload-config'

const { courses, modules, lessons } = payloadSchema

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'content')
const DRY_RUN = process.argv.includes('--dry-run')
// Assign + write back ids for id-less course/module/lesson files, then stop — no DB. The merge
// workflow runs this and commits the ids before the DB sync, so a stable id lands in the repo first.
const ASSIGN_IDS = process.argv.includes('--assign-ids')
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const LESSON_TYPES = ['lecture', 'test', 'coding_task', 'review_task']
// Reserved content-id band: permanently above the CMS's low auto-increment sequence, so a
// file-authored id can never collide with a CMS-generated one.
const BAND_MIN = 1_000_000_000
const BAND_MAX = 2_000_000_000

type Meta = Record<string, unknown>
interface CourseRow { id: number; slug: string; title: string; description: string; order: number; isHidden: boolean }
interface ModuleRow { id: number; slug: string; title: string; courseId: number; order: number; isHidden: boolean }
interface LessonRow { id: number; slug: string; title: string; moduleId: number; order: number; type: string; isHidden: boolean }
interface WriteBack { abs: string; id: number }

function intId(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null
}

// A fresh id in the reserved band that no content file already uses (and no other just-assigned id
// in this run). Mutates `used` so repeated calls don't collide.
function newId(used: Set<number>): number {
  let id: number
  do {
    id = BAND_MIN + Math.floor(Math.random() * (BAND_MAX - BAND_MIN))
  } while (used.has(id))
  used.add(id)
  return id
}

// Insert `id: <n>` as the first line of a file's YAML frontmatter, leaving everything else intact.
function insertFrontmatterId(raw: string, id: number): string {
  return raw.replace(/^---\r?\n/, (m) => `${m}id: ${id}\n`)
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

// Every id already declared anywhere in content/, so a freshly assigned one can't collide.
async function scanUsedIds(dir: string, used: Set<number>): Promise<void> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) await scanUsedIds(p, used)
    else if (e.name.endsWith('.md')) {
      const id = intId((await readMeta(p)).data.id)
      if (id) used.add(id)
    }
  }
}

// Walk content/ into flat course/module/lesson lists. An id-less file gets a fresh reserved-band id
// assigned inline (so its children can reference it) and recorded in `writeBacks` to persist to the
// file. A parent is assigned before its children are read.
async function readContent() {
  const cs: CourseRow[] = []
  const ms: ModuleRow[] = []
  const ls: LessonRow[] = []
  const errors: string[] = []
  const writeBacks: WriteBack[] = []
  const rel = (abs: string) => abs.slice(ROOT.length + 1)

  const used = new Set<number>()
  await scanUsedIds(CONTENT, used)
  const idFor = (abs: string, data: Meta): number => {
    const existing = intId(data.id)
    if (existing) return existing
    const id = newId(used)
    writeBacks.push({ abs, id })
    return id
  }

  for (const courseDir of await subdirs(CONTENT)) {
    const courseSlug = basename(courseDir)
    const courseFile = join(courseDir, '_course.md')
    let cm: { data: Meta; body: string }
    try {
      cm = await readMeta(courseFile)
    } catch {
      continue // not a course directory
    }
    const courseId = idFor(courseFile, cm.data)
    cs.push({
      id: courseId,
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
      const moduleId = idFor(moduleFile, mm.data)
      ms.push({
        id: moduleId,
        slug: moduleSlug,
        title: String(mm.data.title ?? moduleSlug),
        courseId,
        order: Number(mm.data.order ?? 0),
        isHidden: mm.data.isHidden === true,
      })

      for (const e of await readdir(moduleDir, { withFileTypes: true })) {
        if (!e.isFile() || !e.name.endsWith('.md') || e.name.startsWith('_')) continue
        const lessonFile = join(moduleDir, e.name)
        const lm = await readMeta(lessonFile)
        const type = String(lm.data.type ?? 'lecture')
        if (!LESSON_TYPES.includes(type)) errors.push(`${rel(lessonFile)}: unknown type "${type}"`)
        ls.push({
          id: idFor(lessonFile, lm.data),
          slug: basename(e.name, '.md'),
          title: String(lm.data.title ?? ''),
          moduleId,
          order: Number(lm.data.order ?? 0),
          type,
          isHidden: lm.data.isHidden === true,
        })
      }
    }
  }
  return { cs, ms, ls, errors, writeBacks }
}

function fail(message: string, details: string[] = []): never {
  console.error(`\n✗ ${message}`)
  for (const d of details) console.error(`  - ${d}`)
  process.exit(1)
}

// Persist newly assigned ids into their files' frontmatter.
async function applyWriteBacks(writeBacks: WriteBack[]): Promise<void> {
  for (const w of writeBacks) await writeFile(w.abs, insertFrontmatterId(await readFile(w.abs, 'utf8'), w.id))
}

async function main() {
  const { cs, ms, ls, errors, writeBacks } = await readContent()
  if (errors.length) fail('Content has files that cannot be synced:', errors)

  // --assign-ids: persist generated ids to the files and stop (no DB).
  if (ASSIGN_IDS) {
    if (writeBacks.length) {
      await applyWriteBacks(writeBacks)
      console.log(`Assigned ids to ${writeBacks.length} file(s):`)
      for (const w of writeBacks) console.log(`  ${w.id}  ${w.abs.slice(ROOT.length + 1)}`)
    } else {
      console.log('✓ No content ids to assign.')
    }
    return
  }

  const connectionString = process.env.DATABASE_CONNECTION_POOL_URL || process.env.DATABASE_URL
  if (!connectionString) fail('DATABASE_URL is not set.')

  // Persist any assigned ids before the DB write, so a re-run reads a stable id instead of minting
  // a new one (which would insert a duplicate row).
  if (writeBacks.length && !DRY_RUN) await applyWriteBacks(writeBacks)

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
      db.select({ id: courses.id, isHidden: courses.isHidden }).from(courses),
      db.select({ id: modules.id, isHidden: modules.isHidden }).from(modules),
      db.select({ id: lessons.id, isHidden: lessons.isHidden }).from(lessons),
    ])
    const courseHidden = new Map(haveCourses.map((r) => [r.id, r.isHidden ?? false]))
    const moduleHidden = new Map(haveModules.map((r) => [r.id, r.isHidden ?? false]))
    const lessonHidden = new Map(haveLessons.map((r) => [r.id, r.isHidden ?? false]))
    const courseIds = new Set(courseHidden.keys())
    const moduleIds = new Set(moduleHidden.keys())
    const lessonIds = new Set(lessonHidden.keys())

    const newCourses = cs.filter((c) => !courseIds.has(c.id))
    const newModules = ms.filter((m) => !moduleIds.has(m.id))
    const newLessons = ls.filter((l) => !lessonIds.has(l.id))

    // Existing rows whose `isHidden` changed in the files — the one field this sync updates.
    const hideCourses = cs.filter((c) => courseIds.has(c.id) && courseHidden.get(c.id) !== c.isHidden)
    const hideModules = ms.filter((m) => moduleIds.has(m.id) && moduleHidden.get(m.id) !== m.isHidden)
    const hideLessons = ls.filter((l) => lessonIds.has(l.id) && lessonHidden.get(l.id) !== l.isHidden)

    // Referential + rule checks before touching the DB.
    const refErrors: string[] = []
    const willHaveCourse = (id: number) => courseIds.has(id) || newCourses.some((c) => c.id === id)
    const willHaveModule = (id: number) => moduleIds.has(id) || newModules.some((m) => m.id === id)
    for (const m of newModules) if (!willHaveCourse(m.courseId)) refErrors.push(`module ${m.slug} (id ${m.id}): course id ${m.courseId} not found`)
    for (const l of newLessons) {
      if (!willHaveModule(l.moduleId)) refErrors.push(`lesson ${l.slug} (id ${l.id}): module id ${l.moduleId} not found`)
      // Lectures and tests are authored in files (a test's questions land via sync-tests.mjs after
      // this inserts the lesson row). coding_task / review_task still carry CMS-authored data.
      if (l.type !== 'lecture' && l.type !== 'test')
        refErrors.push(`lesson ${l.slug} (id ${l.id}): new lessons must be type "lecture" or "test", got "${l.type}"`)
    }
    if (refErrors.length) fail('Cannot insert new rows:', refErrors)

    const insertTotal = newCourses.length + newModules.length + newLessons.length
    const hideTotal = hideCourses.length + hideModules.length + hideLessons.length
    if (insertTotal === 0 && hideTotal === 0) {
      console.log('✓ Database is in sync with the content files — nothing to insert or update.')
      return
    }

    if (insertTotal) {
      console.log(`${DRY_RUN ? '[dry run] would insert' : 'Inserting'} ${insertTotal} new row(s):`)
      for (const c of newCourses) console.log(`  course  ${c.id}  ${c.slug}`)
      for (const m of newModules) console.log(`  module  ${m.id}  ${m.slug}  (course ${m.courseId})`)
      for (const l of newLessons) console.log(`  lesson  ${l.id}  ${l.slug}  (module ${l.moduleId})`)
    }
    if (hideTotal) {
      console.log(`${DRY_RUN ? '[dry run] would set' : 'Setting'} isHidden on ${hideTotal} existing row(s):`)
      for (const c of hideCourses) console.log(`  course  ${c.id}  ${c.slug}  → isHidden=${c.isHidden}`)
      for (const m of hideModules) console.log(`  module  ${m.id}  ${m.slug}  → isHidden=${m.isHidden}`)
      for (const l of hideLessons) console.log(`  lesson  ${l.id}  ${l.slug}  → isHidden=${l.isHidden}`)
    }

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
          newLessons.map((l) => ({ id: l.id, title: l.title, slug: l.slug, module: l.moduleId, order: l.order, type: l.type as 'lecture' | 'test', isHidden: l.isHidden })),
        )
      for (const c of hideCourses) await tx.update(courses).set({ isHidden: c.isHidden }).where(eq(courses.id, c.id))
      for (const m of hideModules) await tx.update(modules).set({ isHidden: m.isHidden }).where(eq(modules.id, m.id))
      for (const l of hideLessons) await tx.update(lessons).set({ isHidden: l.isHidden }).where(eq(lessons.id, l.id))
    })

    const done = [insertTotal ? `inserted ${insertTotal} row(s)` : '', hideTotal ? `set isHidden on ${hideTotal} row(s)` : ''].filter(Boolean)
    console.log(`\n✓ ${done.join(', ')}.`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
