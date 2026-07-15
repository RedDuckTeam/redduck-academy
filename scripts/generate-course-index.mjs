#!/usr/bin/env node
// Generates an auto-synced outline (README.md) for each course under content/, listing its
// modules and lessons in reading order with links to the lesson files. A plain folder
// listing does not show the `order:` field, so this file is what makes the structure
// legible when browsing on GitHub or in an editor.
//
//   node scripts/generate-course-index.mjs            # write content/<course>/README.md for every course
//   node scripts/generate-course-index.mjs --check    # verify they are up to date (exit 1 if not)
//
// It is never edited by hand. The content pre-commit hook (.githooks/pre-commit) regenerates
// and stages it whenever content/ changes, and CI runs `--check` to catch anything committed
// without the hook (for example via `git commit --no-verify`). README.md is skipped by
// scripts/validate-content.mjs and ignored by the site build, so it is safe to keep here.

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { basename, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'yaml'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'content')
const CHECK = process.argv.includes('--check')
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const NON_LESSON = new Set(['README.md', 'TEMPLATE.md'])

async function subdirs(dir) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) if (e.isDirectory()) out.push(join(dir, e.name))
  return out.sort()
}

async function readMeta(abs) {
  const raw = await readFile(abs, 'utf8')
  const m = raw.match(FRONTMATTER)
  if (!m) return { data: {}, body: raw }
  return { data: yaml.parse(m[1]) ?? {}, body: raw.slice(m[0].length) }
}

const num = (v) => (typeof v === 'number' ? v : 0)
const str = (v, fallback) => (typeof v === 'string' && v.trim() ? v.trim() : fallback)

// Read one course directory into { slug, title, description, modules[ { lessons[] } ] }.
// Returns null for a directory that is not a course (no _course.md).
async function readCourse(courseDir) {
  let course
  try {
    course = await readMeta(join(courseDir, '_course.md'))
  } catch {
    return null
  }
  const modules = []
  for (const moduleDir of await subdirs(courseDir)) {
    let mod
    try {
      mod = await readMeta(join(moduleDir, '_module.md'))
    } catch {
      continue // not a module directory
    }
    const lessons = []
    for (const e of await readdir(moduleDir, { withFileTypes: true })) {
      if (!e.isFile() || !e.name.endsWith('.md') || e.name.startsWith('_') || NON_LESSON.has(e.name)) continue
      const lm = await readMeta(join(moduleDir, e.name))
      const slug = basename(e.name, '.md')
      lessons.push({
        slug,
        title: str(lm.data.title, slug),
        type: str(lm.data.type, 'lecture'),
        order: num(lm.data.order),
        isHidden: lm.data.isHidden === true,
      })
    }
    lessons.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))
    modules.push({
      slug: basename(moduleDir),
      title: str(mod.data.title, basename(moduleDir)),
      order: num(mod.data.order),
      isHidden: mod.data.isHidden === true,
      lessons,
    })
  }
  modules.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))
  return {
    slug: basename(courseDir),
    dir: courseDir,
    title: str(course.data.title, basename(courseDir)),
    description: course.body.trim(),
    isHidden: course.data.isHidden === true,
    modules,
  }
}

function render(course) {
  const L = []
  L.push('<!-- AUTO-GENERATED FILE — DO NOT EDIT BY HAND.')
  L.push('     Regenerated from the lesson .md files by scripts/generate-course-index.mjs,')
  L.push('     which runs on the content pre-commit hook and is verified in CI. -->')
  L.push('')
  L.push(`# ${course.title}${course.isHidden ? ' _(hidden)_' : ''}`)
  if (course.description) {
    L.push('')
    L.push(course.description)
  }
  L.push('')
  L.push('## Contents')
  if (!course.modules.length) {
    L.push('')
    L.push('_No modules yet._')
  }
  course.modules.forEach((m, mi) => {
    L.push('')
    L.push(`### ${mi + 1}. ${m.title}${m.isHidden ? ' _(hidden)_' : ''}`)
    L.push('')
    if (!m.lessons.length) {
      L.push('_No lessons yet._')
      return
    }
    m.lessons.forEach((l, li) => {
      const type = l.type !== 'lecture' ? ` — ${l.type.replace(/_/g, ' ')}` : ''
      const hidden = l.isHidden ? ' _(hidden)_' : ''
      L.push(`${li + 1}. [${l.title}](${m.slug}/${l.slug}.md)${type}${hidden}`)
    })
  })
  return L.join('\n').replace(/\s+$/, '') + '\n'
}

async function main() {
  const courses = []
  for (const d of await subdirs(CONTENT)) {
    const c = await readCourse(d)
    if (c) courses.push(c)
  }

  const stale = []
  for (const c of courses) {
    const target = join(c.dir, 'README.md')
    const next = render(c)
    let current = null
    try {
      current = await readFile(target, 'utf8')
    } catch {
      // file does not exist yet
    }
    if (current === next) continue
    if (CHECK) {
      stale.push(relative(ROOT, target))
      continue
    }
    await writeFile(target, next)
    console.log(`wrote ${relative(ROOT, target)}`)
  }

  if (CHECK) {
    if (stale.length) {
      console.error('✗ Course outline(s) are out of date:')
      for (const s of stale) console.error(`  - ${s}`)
      console.error('\nRun `yarn content:index` and commit the result.')
      process.exit(1)
    }
    console.log('✓ All course outlines are up to date.')
    return
  }
  console.log(`\n${courses.length} course outline(s) in sync.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
