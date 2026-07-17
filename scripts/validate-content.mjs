#!/usr/bin/env node
// Validates content/**/*.md against the format in content/README.md + content/TEMPLATE.md:
// frontmatter shape, required fields, types, slugs, tree completeness, and basic body
// sanity — i.e. that every file can be parsed into a lesson. Reads files only; never
// touches the DB. Exits 1 if any file has errors (warnings don't fail).
//
//   node scripts/validate-content.mjs                    # validate the whole tree
//   node scripts/validate-content.mjs content/a/b/c.md   # validate one file

import { readFile, readdir } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'yaml'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'content')
const SKIP = new Set(['README.md', 'TEMPLATE.md'])
const LESSON_TYPES = ['lecture', 'test', 'coding_task', 'review_task']
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// A test lesson's questions live in its body. `<!-- q:ID -->` starts a question; each option is a
// GitHub task-list line (`- [x]` correct / `- [ ]` not) carrying its stable id in a trailing
// `<!-- a:ID -->`. Ids are the join key into learners' stored answers, so they must be present and
// globally unique. Multi-answer questions must cue it in the stem (matches the runtime's
// `isMultipleChoices = correctCount > 1`).
const Q_MARKER_RE = /^<!--\s*q:\s*([^\s>]+)\s*-->$/
const OPTION_RE = /^- \[([ xX])\]\s+(.*?)\s*<!--\s*a:\s*([^\s>]+)\s*-->$/
const TEST_ID_RE = /^[A-Za-z0-9_-]{6,}$/
const MULTI_CUE_RE = /select all|choose all|all that apply|select every|select each/i
const ALLOWED = {
  course: ['id', 'title', 'order', 'isHidden'],
  module: ['id', 'title', 'order', 'isHidden'],
  lesson: ['id', 'title', 'type', 'order', 'isHidden', 'faq'],
}

async function mdFiles(dir) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await mdFiles(p)))
    else if (e.name.endsWith('.md') && !SKIP.has(e.name)) out.push(p)
  }
  return out
}

// Split "---\n<yaml>\n---\n<body>". Returns { data, body } or { fmError }.
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { fmError: 'missing YAML frontmatter block (file must start with `---`)' }
  try {
    const data = yaml.parse(m[1])
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      return { fmError: 'frontmatter is not a key/value map' }
    }
    return { data, body: raw.slice(m[0].length) }
  } catch (e) {
    return { fmError: `invalid YAML: ${e.message.split('\n')[0]}` }
  }
}

// Classify a file by its path shape.
function classify(relPath) {
  const parts = relPath.split(sep)
  const base = parts.at(-1)
  if (parts.length === 2 && base === '_course.md') return { role: 'course', course: parts[0] }
  if (parts.length === 3 && base === '_module.md') return { role: 'module', course: parts[0], module: parts[1] }
  if (parts.length === 3 && !base.startsWith('_')) {
    return { role: 'lesson', course: parts[0], module: parts[1], lesson: base.replace(/\.md$/, '') }
  }
  return { role: 'unknown', parts }
}

// Parse the questions section of a test-lesson body. Everything before the first `<!-- q: -->`
// marker is the intro (the lesson content); questions follow. A stem may contain fenced code, so
// option parsing is fence-aware (a `- [ ]` inside ``` is code, not an option). Returns
// { questions: [{ id, stem, options: [{ id, label, correct }] }], parseErrors }. The DB sync reuses
// this exact parser so validation and sync agree on what a file means.
function parseTestQuestions(body) {
  const parseErrors = []
  const lines = body.split('\n')
  const start = lines.findIndex((l) => Q_MARKER_RE.test(l.trim()))
  if (start === -1) return { questions: [], parseErrors }

  const questions = []
  let cur = null
  let inFence = false
  for (const line of lines.slice(start)) {
    const trimmed = line.trim()
    const marker = trimmed.match(Q_MARKER_RE)
    // A question marker always starts a new question and resets fence state, so an unbalanced
    // ``` fence in one stem can never swallow the questions that follow it.
    if (marker) {
      if (cur) questions.push(cur)
      cur = { id: marker[1], stemLines: [], options: [] }
      inFence = false
      continue
    }
    if (!cur) continue
    if (/^```/.test(trimmed)) inFence = !inFence
    if (!inFence) {
      const opt = line.match(OPTION_RE)
      if (opt) {
        cur.options.push({ correct: opt[1].toLowerCase() === 'x', label: opt[2].trim(), id: opt[3] })
        continue
      }
      // A task-list line that doesn't carry a well-formed id comment is a mistake worth flagging.
      if (/^- \[[ xX]?\]/.test(trimmed)) {
        parseErrors.push(`question ${cur.id}: malformed option (expected \`- [ ] text  <!-- a:ID -->\`): ${trimmed.slice(0, 70)}`)
        continue
      }
    }
    if (cur.options.length === 0) cur.stemLines.push(line)
  }
  if (cur) questions.push(cur)
  for (const q of questions) q.stem = q.stemLines.join('\n').trim()
  return { questions, parseErrors }
}

function validate(file, raw, meta, sets) {
  const errors = []
  const warn = []
  const err = (msg) => errors.push(msg)
  const c = classify(relative(CONTENT, file))

  if (c.role === 'unknown') {
    err(
      'unexpected file location — expected content/<course>/_course.md, ' +
        'content/<course>/<module>/_module.md, or content/<course>/<module>/<lesson>.md',
    )
    return { errors, warn }
  }

  for (const slug of [c.course, c.module, c.lesson].filter(Boolean)) {
    if (!SLUG_RE.test(slug)) err(`"${slug}" is not a valid slug (lowercase letters, digits, and hyphens only)`)
  }

  const { data, body, fmError } = parseFrontmatter(raw)
  if (fmError) {
    err(fmError)
    return { errors, warn }
  }

  const reqString = (k) => {
    if (typeof data[k] !== 'string' || data[k].trim() === '') err(`${k}: required, must be a non-empty string`)
  }
  const reqNumber = (k) => {
    if (typeof data[k] !== 'number') err(`${k}: required, must be a number (got ${JSON.stringify(data[k])})`)
  }
  const optType = (k, t) => {
    if (data[k] !== undefined && typeof data[k] !== t) err(`${k}: must be a ${t} when present`)
  }

  reqString('title')
  reqNumber('order')
  optType('id', 'number')
  optType('isHidden', 'boolean')

  // `id` is the stable link to the CMS row. It must be a positive integer and unique
  // among files of the same kind (courses, modules, and lessons each have their own id
  // sequence in the CMS), so two of them can never claim the same DB row.
  if (typeof data.id === 'number') {
    if (!Number.isInteger(data.id) || data.id <= 0) err('id: must be a positive integer')
    const rel = relative(ROOT, file)
    const others = (sets.idOwners.get(`${c.role}:${data.id}`) ?? []).filter((o) => o !== rel)
    if (others.length) {
      err(`id ${data.id} is already used by another ${c.role} (${others.join(', ')}) — pick a fresh one with \`node scripts/new-id.mjs\``)
    }
  }

  for (const k of Object.keys(data)) {
    if (!ALLOWED[c.role].includes(k)) warn.push(`unknown field "${k}" (allowed: ${ALLOWED[c.role].join(', ')})`)
  }

  if (c.role === 'lesson') {
    if (!LESSON_TYPES.includes(data.type)) {
      err(`type: "${data.type}" is not one of ${LESSON_TYPES.join(', ')}`)
    }
    if (data.faq !== undefined) {
      if (!Array.isArray(data.faq)) err('faq: must be a list')
      else
        data.faq.forEach((row, i) => {
          if (!row || typeof row.question !== 'string' || !row.question.trim())
            err(`faq[${i}].question: required non-empty string`)
          if (!row || typeof row.answer !== 'string' || !row.answer.trim())
            err(`faq[${i}].answer: required non-empty string`)
        })
    }
    // Parent metadata must exist so the lesson resolves to a course/module.
    if (!sets.courses.has(c.course)) err(`missing content/${c.course}/_course.md for this lesson's course`)
    if (!sets.modules.has(`${c.course}/${c.module}`))
      err(`missing content/${c.course}/${c.module}/_module.md for this lesson's module`)
    if (data.type === 'lecture' && body.trim() === '') warn.push('lecture body is empty')

    const open = (body.match(/<svg\b/gi) ?? []).length
    const close = (body.match(/<\/svg>/gi) ?? []).length
    if (open !== close) err(`unbalanced <svg> tags: ${open} opening, ${close} closing`)

    if (data.type === 'test') {
      const { questions, parseErrors } = parseTestQuestions(body)
      for (const pe of parseErrors) err(pe)
      if (questions.length === 0) err('test has no questions — add at least one `<!-- q:ID -->` block with options')

      const rel = relative(ROOT, file)
      const localIds = new Map() // id -> count in this file, for intra-file duplicate detection
      questions.forEach((q, qi) => {
        const at = `question ${qi + 1}${q.id ? ` (id ${q.id})` : ''}`
        if (!q.id || !TEST_ID_RE.test(q.id)) err(`${at}: missing or invalid question id comment`)
        if (!q.stem) err(`${at}: empty question stem`)
        if (q.options.length < 2) err(`${at}: needs at least 2 options (found ${q.options.length})`)

        const correct = q.options.filter((o) => o.correct)
        if (q.options.length > 0 && correct.length === 0) err(`${at}: no correct option is marked (use \`- [x]\`)`)
        if (correct.length > 1 && !MULTI_CUE_RE.test(q.stem)) {
          err(`${at}: ${correct.length} options are marked correct but the stem has no "select all that apply" cue`)
        }

        const seenLabels = new Set()
        for (const o of q.options) {
          if (!o.label) err(`${at}: an option has an empty label`)
          if (!o.id || !TEST_ID_RE.test(o.id)) err(`${at}: option "${o.label.slice(0, 30)}" has a missing or invalid id comment`)
          const labelKey = o.label.toLowerCase()
          if (seenLabels.has(labelKey)) err(`${at}: duplicate option "${o.label.slice(0, 40)}"`)
          seenLabels.add(labelKey)
        }

        for (const id of [q.id, ...q.options.map((o) => o.id)].filter(Boolean)) {
          localIds.set(id, (localIds.get(id) ?? 0) + 1)
          const others = [...(sets.testIdOwners.get(id) ?? [])].filter((o) => o !== rel)
          if (others.length) err(`id "${id}" is also used in ${others.join(', ')} — every question/option id must be unique`)
        }
      })
      for (const [id, count] of localIds) {
        if (count > 1) err(`id "${id}" appears ${count} times in this file — each question and option needs its own id`)
      }
    }
  }

  return { errors, warn }
}

async function main() {
  const all = (await mdFiles(CONTENT)).sort()
  // Build the set of existing course/module metadata for parent checks.
  const sets = { courses: new Set(), modules: new Set(), idOwners: new Map(), testIdOwners: new Map() }
  for (const f of all) {
    const c = classify(relative(CONTENT, f))
    if (c.role === 'course') sets.courses.add(c.course)
    if (c.role === 'module') sets.modules.add(`${c.course}/${c.module}`)
    const { data, body } = parseFrontmatter(await readFile(f, 'utf8'))
    // Collect declared ids per role. Payload gives each collection its own id sequence,
    // so a course, a module, and a lesson may legitimately share a number — only a clash
    // within the same role means two files point at the same DB row.
    if (data && typeof data.id === 'number' && c.role !== 'unknown') {
      const key = `${c.role}:${data.id}`
      const owners = sets.idOwners.get(key) ?? []
      owners.push(relative(ROOT, f))
      sets.idOwners.set(key, owners)
    }
    // Collect every question/option id so we can flag a collision across tests (they are primary
    // keys, so a duplicate would fail the DB insert). All test-element ids share one namespace.
    if (c.role === 'lesson' && data?.type === 'test' && body) {
      const rel = relative(ROOT, f)
      for (const q of parseTestQuestions(body).questions) {
        for (const id of [q.id, ...q.options.map((o) => o.id)].filter(Boolean)) {
          const owners = sets.testIdOwners.get(id) ?? new Set()
          owners.add(rel)
          sets.testIdOwners.set(id, owners)
        }
      }
    }
  }

  const argFile = process.argv[2]
  const targets = argFile ? all.filter((f) => f === join(ROOT, argFile) || f.endsWith(argFile)) : all
  if (argFile && targets.length === 0) {
    console.error(`No content file matched "${argFile}".`)
    process.exit(1)
  }

  let ok = 0
  let bad = 0
  let warnings = 0
  for (const file of targets) {
    const raw = await readFile(file, 'utf8')
    const { errors, warn } = validate(file, raw, {}, sets)
    const rel = relative(ROOT, file)
    if (errors.length === 0 && warn.length === 0) {
      ok++
      continue
    }
    console.log(rel)
    for (const e of errors) console.log(`  ✗ ${e}`)
    for (const w of warn) console.log(`  ⚠ ${w}`)
    if (errors.length) bad++
    else ok++
    warnings += warn.length
  }

  console.log('─'.repeat(48))
  console.log(`${targets.length} file(s): ${ok} ok, ${bad} with errors, ${warnings} warning(s).`)
  process.exit(bad > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
