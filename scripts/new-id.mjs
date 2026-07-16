#!/usr/bin/env node
// Prints a fresh content `id`: a random integer in the reserved band [1e9, 2e9) that no
// content file already uses. Paste it into a brand-new course/module/lesson's frontmatter
// as `id: <n>`.
//
// Why a high band: the CMS hands out small auto-increment ids (a few hundred today) and
// only ever moves that counter forward one row at a time. An id up in the billions sits
// permanently above anything the CMS will generate, so a file-authored id can never
// collide with a CMS one. Random within the band makes two contributors clashing
// astronomically unlikely, and `scripts/validate-content.mjs` catches the rare case.
//
//   node scripts/new-id.mjs

import { readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'content')
const BAND_MIN = 1_000_000_000
const BAND_MAX = 2_000_000_000

async function mdFiles(dir) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await mdFiles(p)))
    else if (e.name.endsWith('.md')) out.push(p)
  }
  return out
}

const used = new Set()
for (const f of await mdFiles(CONTENT)) {
  const raw = await readFile(f, 'utf8')
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) continue
  const m = fm[1].match(/^id:\s*(\d+)\s*$/m)
  if (m) used.add(Number(m[1]))
}

let id
do {
  id = BAND_MIN + Math.floor(Math.random() * (BAND_MAX - BAND_MIN))
} while (used.has(id))

process.stdout.write(`\nAdd this line to your file's YAML frontmatter:\n\n  id: ${id}\n\n`)
process.stdout.write('(random, currently unused, in the reserved content-id band)\n')
