#!/usr/bin/env node
/**
 * Walks installed @openzeppelin/contracts (and packages/solc-utils/scaffold if it exists)
 * and emits two TS modules consumed by the browser worker:
 *
 *   src/stdlib.generated.ts        — Record<canonicalPath, fileContents>
 *   src/stdlib-paths.generated.ts  — readonly string[] of canonical paths
 *
 * The two-file split keeps the autocomplete bundle small (paths only) while the
 * actual source map only lives in the solc worker chunk.
 *
 * Runs on `yarn install` via the postinstall hook in package.json. Skip-safe:
 * if @openzeppelin/contracts isn't resolvable yet (e.g. yarn install pass 1
 * during a fresh clone before deps land), emits empty stdlib maps so tsc still
 * runs; next install pass populates them properly.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const here = path.dirname(new URL(import.meta.url).pathname)
const srcDir = path.join(here, '..', 'src')
const require = createRequire(import.meta.url)

const stdlib = {}

try {
  const ozPkgJson = require.resolve('@openzeppelin/contracts/package.json')
  const ozRoot = path.dirname(ozPkgJson)
  walk(ozRoot, '@openzeppelin/contracts')
} catch (err) {
  console.warn(
    '[solc-utils stdlib] @openzeppelin/contracts not resolvable yet — emitting empty stdlib. ' +
      'Run yarn install again once deps land.',
    err?.message ?? err,
  )
}

const scaffoldDir = path.join(here, '..', 'scaffold')
if (fs.existsSync(scaffoldDir)) walk(scaffoldDir, '@redduck/scaffold')

const paths = Object.keys(stdlib).sort()

writeFile(
  path.join(srcDir, 'stdlib.generated.ts'),
  [
    '// AUTO-GENERATED — do not edit. Regenerated on yarn install (postinstall hook in @redduck/solc-utils).',
    '// To regenerate manually: yarn solc-utils:build-stdlib',
    '/* eslint-disable */',
    `export const STDLIB: Record<string, string> = ${JSON.stringify(stdlib, null, 2)}`,
    '',
  ].join('\n'),
)

writeFile(
  path.join(srcDir, 'stdlib-paths.generated.ts'),
  [
    '// AUTO-GENERATED — do not edit. Regenerated on yarn install (postinstall hook in @redduck/solc-utils).',
    '// Paths only (no sources). Safe to import into the editor bundle without pulling the full stdlib.',
    '/* eslint-disable */',
    `export const STDLIB_PATHS: readonly string[] = ${JSON.stringify(paths, null, 2)}`,
    '',
  ].join('\n'),
)

console.log(`[solc-utils stdlib] wrote ${paths.length} files`)

function walk(dir, prefix) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    const next = `${prefix}/${entry.name}`
    if (entry.isDirectory()) {
      walk(full, next)
    } else if (entry.name.endsWith('.sol')) {
      stdlib[next] = fs.readFileSync(full, 'utf-8')
    }
  }
}

function writeFile(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
}
