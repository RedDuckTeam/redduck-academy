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
  }

  return { errors, warn }
}

async function main() {
  const all = (await mdFiles(CONTENT)).sort()
  // Build the set of existing course/module metadata for parent checks.
  const sets = { courses: new Set(), modules: new Set(), idOwners: new Map() }
  for (const f of all) {
    const c = classify(relative(CONTENT, f))
    if (c.role === 'course') sets.courses.add(c.course)
    if (c.role === 'module') sets.modules.add(`${c.course}/${c.module}`)
    // Collect declared ids per role. Payload gives each collection its own id sequence,
    // so a course, a module, and a lesson may legitimately share a number — only a clash
    // within the same role means two files point at the same DB row.
    const { data } = parseFrontmatter(await readFile(f, 'utf8'))
    if (data && typeof data.id === 'number' && c.role !== 'unknown') {
      const key = `${c.role}:${data.id}`
      const owners = sets.idOwners.get(key) ?? []
      owners.push(relative(ROOT, f))
      sets.idOwners.set(key, owners)
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
