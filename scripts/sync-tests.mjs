// Syncs test-question content (questions + options) from the `*-test.md` files into the Payload
// Postgres database. Runs on merge to main (and manually):
//
//   DATABASE_URL=... node scripts/sync-tests.mjs [--dry-run]
//
// Unlike sync-content-db.ts (which is insert-only for structural rows so it can never drop user
// progress), the MD files are the source of truth for test content, so this script fully upserts:
//   • Questions/options are matched by id. An id present in a file but not the DB is inserted; a
//     matching pair whose text/answer/order changed is updated; an id in the DB but no longer in any
//     file is deleted.
//   • Cascade prune. Deleting a question drops every stored user answer for it; deleting an option
//     strips that option from users' stored answers. (Option rows cascade-delete with their
//     question via FK; user answers live in a separate table and are pruned here.)
//   • Id-less authoring. A contributor writes `<!-- q -->` / `- [x] text` with no ids; this script
//     assigns 24-hex ids and writes them back into the file so future runs are stable.
//   • richText is rebuilt from Markdown with the same node shapes the admin editor produces, so the
//     site renders it identically. Change detection ignores the internal code-block node id.
//
// It only touches lessons that already exist in the DB and are type `test`; adding a brand-new test
// lesson still needs its lesson row (authored as a lecture-style structural row first).

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import yaml from 'yaml'
import { parseTestQuestions, mdToLexical, makeId, richTextSig } from './lib/tests-md.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'content')
const DRY_RUN = process.argv.includes('--dry-run')
// Assign + write back ids for id-less questions/options, then stop — no DB. The merge workflow runs
// this and commits the ids before the DB sync, so a stable id always lands in the repo first.
const ASSIGN_IDS = process.argv.includes('--assign-ids')
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

function fail(message, details = []) {
  console.error(`\n✗ ${message}`)
  for (const d of details) console.error(`  - ${d}`)
  process.exit(1)
}

async function walk(dir) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else if (e.isFile() && e.name.endsWith('.md')) out.push(p)
  }
  return out
}

// Rebuild a learner's stored answers after questions/options were removed: drop deleted-question
// keys entirely and strip deleted option ids from the remaining arrays. Returns the new object, or
// null when nothing changed (so the caller can skip a no-op write).
function pruneAnswers(answers, deletedQ, deletedO) {
  if (!answers || typeof answers !== 'object') return null
  const next = {}
  let changed = false
  for (const [qid, oids] of Object.entries(answers)) {
    if (deletedQ.has(qid)) {
      changed = true
      continue
    }
    const del = deletedO.get(qid)
    if (del && Array.isArray(oids) && oids.some((o) => del.has(o))) {
      next[qid] = oids.filter((o) => !del.has(o))
      changed = true
    } else {
      next[qid] = oids
    }
  }
  return changed ? next : null
}

// Read every `type: test` file into a working record: the parsed questions (with freshly assigned
// ids for anything id-less), the split body lines (for id write-back), and the lesson id.
async function readTestFiles() {
  const files = []
  const errors = []
  const rel = (abs) => abs.slice(ROOT.length + 1)

  for (const abs of (await walk(CONTENT)).sort()) {
    const raw = await readFile(abs, 'utf8')
    const fm = raw.match(FRONTMATTER)
    if (!fm) continue
    const data = yaml.parse(fm[1]) ?? {}
    if (String(data.type) !== 'test') continue

    const lessonId = typeof data.id === 'number' && Number.isInteger(data.id) && data.id > 0 ? data.id : null
    if (!lessonId) errors.push(`${rel(abs)}: missing or invalid lesson id`)

    const body = raw.slice(fm[0].length)
    const bodyLines = body.split('\n')
    const { questions, parseErrors } = parseTestQuestions(body)
    for (const e of parseErrors) errors.push(`${rel(abs)}: ${e}`)
    if (questions.length === 0) errors.push(`${rel(abs)}: no questions found`)

    let needsWriteBack = false
    questions.forEach((q, qi) => {
      if (q.options.length < 2) errors.push(`${rel(abs)}: question ${qi + 1} has fewer than 2 options`)
      if (!q.options.some((o) => o.correct)) errors.push(`${rel(abs)}: question ${qi + 1} has no correct option`)
      if (!q.id) {
        q.id = makeId()
        bodyLines[q.markerLine] = `<!-- q:${q.id} -->`
        needsWriteBack = true
      }
      for (const o of q.options) {
        if (!o.id) {
          o.id = makeId()
          bodyLines[o.line] = `${bodyLines[o.line].replace(/\s+$/, '')}  <!-- a:${o.id} -->`
          needsWriteBack = true
        }
      }
    })

    files.push({ abs, rel: rel(abs), fm: fm[0], bodyLines, lessonId, questions, needsWriteBack })
  }

  // Duplicate ids (across all files) would make matching ambiguous.
  const seenLesson = new Map()
  const seenQ = new Map()
  const seenO = new Map()
  for (const f of files) {
    if (f.lessonId && seenLesson.has(f.lessonId)) errors.push(`two test files claim lesson id ${f.lessonId}: ${f.rel} and ${seenLesson.get(f.lessonId)}`)
    else if (f.lessonId) seenLesson.set(f.lessonId, f.rel)
  }
  for (const f of files)
    for (const q of f.questions) {
      if (seenQ.has(q.id)) errors.push(`duplicate question id ${q.id} in ${f.rel} and ${seenQ.get(q.id)}`)
      else seenQ.set(q.id, f.rel)
      for (const o of q.options) {
        if (seenO.has(o.id)) errors.push(`duplicate option id ${o.id} in ${f.rel} and ${seenO.get(o.id)}`)
        else seenO.set(o.id, f.rel)
      }
    }

  if (errors.length) fail('Test content cannot be synced:', errors)
  return files
}

async function main() {
  const files = await readTestFiles()

  // --assign-ids: persist generated ids to the files and stop (no DB).
  if (ASSIGN_IDS) {
    const wb = files.filter((f) => f.needsWriteBack)
    for (const f of wb) await writeFile(f.abs, f.fm + f.bodyLines.join('\n'))
    console.log(wb.length ? `Assigned ids in ${wb.length} test file(s): ${wb.map((f) => f.rel).join(', ')}` : '✓ No test ids to assign.')
    return
  }

  const connectionString = process.env.DATABASE_CONNECTION_POOL_URL || process.env.DATABASE_URL
  if (!connectionString) fail('DATABASE_URL is not set.')
  if (files.length === 0) {
    console.log('✓ No test files found — nothing to sync.')
    return
  }

  const isLocal = /^postgres(ql)?:\/\/\//.test(connectionString) || /localhost|127\.0\.0\.1|host=\//.test(connectionString)
  const sql = postgres(connectionString, {
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 1,
    prepare: !process.env.DATABASE_CONNECTION_POOL_URL,
  })

  try {
    const lessonIds = files.map((f) => f.lessonId)
    const dbLessons = await sql`select id, type from payload.lessons where id in ${sql(lessonIds)}`
    const lessonType = new Map(dbLessons.map((r) => [r.id, r.type]))
    const refErrors = []
    for (const f of files) {
      if (!lessonType.has(f.lessonId)) refErrors.push(`${f.rel}: lesson id ${f.lessonId} not found in DB`)
      else if (lessonType.get(f.lessonId) !== 'test') refErrors.push(`${f.rel}: lesson ${f.lessonId} is type "${lessonType.get(f.lessonId)}", not test`)
    }
    if (refErrors.length) fail('Cannot sync test content:', refErrors)

    const dbQuestions = await sql`select id, _parent_id, _order, question from payload.lessons_questions where _parent_id in ${sql(lessonIds)}`
    const dbOptions = dbQuestions.length
      ? await sql`select id, _parent_id, _order, is_correct, label from payload.lessons_questions_options where _parent_id in ${sql(dbQuestions.map((q) => q.id))}`
      : []

    const dbQByLesson = new Map(lessonIds.map((id) => [id, new Map()]))
    for (const q of dbQuestions) dbQByLesson.get(q._parent_id)?.set(q.id, q)
    const dbOByQuestion = new Map(dbQuestions.map((q) => [q.id, new Map()]))
    for (const o of dbOptions) dbOByQuestion.get(o._parent_id)?.set(o.id, o)

    // Build the change plan across all lessons.
    const plan = {
      qInsert: [], // { id, lessonId, order, question }
      qUpdate: [], // { id, order, question }
      qDelete: [], // id
      oInsert: [], // { id, questionId, order, label, isCorrect }
      oUpdate: [], // { id, order, label, isCorrect }
      oDelete: [], // id
      prune: new Map(), // lessonId -> { deletedQ: Set, deletedO: Map<qid, Set> }
    }
    const pruneFor = (lessonId) => {
      if (!plan.prune.has(lessonId)) plan.prune.set(lessonId, { deletedQ: new Set(), deletedO: new Map() })
      return plan.prune.get(lessonId)
    }

    for (const f of files) {
      const dbQs = dbQByLesson.get(f.lessonId)
      const mdQIds = new Set(f.questions.map((q) => q.id))

      f.questions.forEach((q, qi) => {
        const order = qi + 1
        const stem = mdToLexical(q.stem)
        const dbQ = dbQs.get(q.id)
        if (!dbQ) {
          plan.qInsert.push({ id: q.id, lessonId: f.lessonId, order, question: stem })
        } else if (richTextSig(stem) !== richTextSig(dbQ.question) || dbQ._order !== order) {
          plan.qUpdate.push({ id: q.id, order, question: stem })
        }

        const dbOs = dbOByQuestion.get(q.id) ?? new Map()
        const mdOIds = new Set(q.options.map((o) => o.id))
        q.options.forEach((o, oi) => {
          const oOrder = oi + 1
          const label = mdToLexical(o.label)
          const dbO = dbOs.get(o.id)
          if (!dbO) {
            plan.oInsert.push({ id: o.id, questionId: q.id, order: oOrder, label, isCorrect: o.correct })
          } else if (richTextSig(label) !== richTextSig(dbO.label) || dbO.is_correct !== o.correct || dbO._order !== oOrder) {
            plan.oUpdate.push({ id: o.id, order: oOrder, label, isCorrect: o.correct })
          }
        })
        for (const [oid] of dbOs) {
          if (!mdOIds.has(oid)) {
            plan.oDelete.push(oid)
            const p = pruneFor(f.lessonId)
            if (!p.deletedO.has(q.id)) p.deletedO.set(q.id, new Set())
            p.deletedO.get(q.id).add(oid)
          }
        }
      })

      for (const [qid] of dbQs) {
        if (!mdQIds.has(qid)) {
          plan.qDelete.push(qid) // options cascade via FK
          pruneFor(f.lessonId).deletedQ.add(qid)
        }
      }
    }

    // Lessons that lost a question or option — their learners' stored answers need pruning. The
    // actual prune runs inside the transaction below (locking the rows); this pass only counts how
    // many rows would change, for the plan summary and dry-run.
    const lessonsLosing = [...plan.prune].filter(([, p]) => p.deletedQ.size || p.deletedO.size).map(([id]) => id)
    let pruneCount = 0
    for (const lessonId of lessonsLosing) {
      const { deletedQ, deletedO } = plan.prune.get(lessonId)
      const rows = await sql`select user_answers from public.user_lessons where lesson_id = ${lessonId}`
      for (const row of rows) if (pruneAnswers(row.user_answers, deletedQ, deletedO)) pruneCount++
    }

    const counts = {
      'questions inserted': plan.qInsert.length,
      'questions updated': plan.qUpdate.length,
      'questions deleted': plan.qDelete.length,
      'options inserted': plan.oInsert.length,
      'options updated': plan.oUpdate.length,
      'options deleted': plan.oDelete.length,
      'user answers pruned': pruneCount,
    }
    const idWriteBacks = files.filter((f) => f.needsWriteBack)
    const total = Object.values(counts).reduce((a, b) => a + b, 0)

    console.log(`${DRY_RUN ? '[dry run] ' : ''}Test sync plan:`)
    for (const [k, v] of Object.entries(counts)) if (v) console.log(`  ${k}: ${v}`)
    if (idWriteBacks.length) console.log(`  files needing id write-back: ${idWriteBacks.map((f) => f.rel).join(', ')}`)
    if (total === 0 && idWriteBacks.length === 0) {
      console.log('✓ Database is already in sync with the test files.')
      return
    }

    if (DRY_RUN) {
      console.log('\n[dry run] no changes written.')
      return
    }

    // Persist ids to the files first: if the DB write later fails, a re-run reads those ids and
    // inserts (rather than minting new ids and duplicating).
    for (const f of idWriteBacks) await writeFile(f.abs, f.fm + f.bodyLines.join('\n'))

    await sql.begin(async (tx) => {
      for (const id of plan.oDelete) await tx`delete from payload.lessons_questions_options where id = ${id}`
      for (const id of plan.qDelete) await tx`delete from payload.lessons_questions where id = ${id}`
      for (const q of plan.qInsert)
        await tx`insert into payload.lessons_questions (id, _parent_id, _order, question) values (${q.id}, ${q.lessonId}, ${q.order}, ${sql.json(q.question)})`
      for (const o of plan.oInsert)
        await tx`insert into payload.lessons_questions_options (id, _parent_id, _order, label, is_correct) values (${o.id}, ${o.questionId}, ${o.order}, ${sql.json(o.label)}, ${o.isCorrect})`
      for (const q of plan.qUpdate) await tx`update payload.lessons_questions set _order = ${q.order}, question = ${sql.json(q.question)} where id = ${q.id}`
      for (const o of plan.oUpdate)
        await tx`update payload.lessons_questions_options set _order = ${o.order}, label = ${sql.json(o.label)}, is_correct = ${o.isCorrect} where id = ${o.id}`
      // Prune learners' stored answers in the same transaction, locking each row so a concurrent
      // answer submission can't be lost.
      for (const lessonId of lessonsLosing) {
        const { deletedQ, deletedO } = plan.prune.get(lessonId)
        const rows = await tx`select id, user_answers from public.user_lessons where lesson_id = ${lessonId} for update`
        for (const row of rows) {
          const next = pruneAnswers(row.user_answers, deletedQ, deletedO)
          if (next) await tx`update public.user_lessons set user_answers = ${sql.json(next)} where id = ${row.id}`
        }
      }
    })

    console.log(`\n✓ Synced ${total} change(s)${idWriteBacks.length ? ` and wrote ids into ${idWriteBacks.length} file(s)` : ''}.`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
