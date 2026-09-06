import type { LessonFaqItem } from '@/types/lesson'

// YAML frontmatter helpers for the open-source content files. The frontmatter block
// is produced by scripts/dump-content.mjs (`---\n…\n---\n`); this is its sole reader
// in the app, so keep the delimiter contract here in one place.

export const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/
const FRONTMATTER_CAPTURE = /^---\r?\n([\s\S]*?)\r?\n---/

/** Strip the leading YAML frontmatter block from a Markdown string. */
export function stripFrontmatter(raw: string): string {
  const match = raw.match(FRONTMATTER_RE)
  return match ? raw.slice(match[0].length) : raw
}

// A `<!-- q -->` / `<!-- q:ID -->` marker on its own line begins a test lesson's question block.
// Exported so the editor can warn about one in a lecture using the very pattern that would truncate
// the page. `scripts/lib/tests-md.mjs` matches the same marker in the content pipeline; the two
// must stay in step.
export const TEST_QUESTION_MARKER_RE = /^[ \t]*<!--\s*q(?::\s*[^\s>]+)?\s*-->[ \t]*$/m

/**
 * Drop a test lesson's question block from its body. In a `type: test` file the questions live
 * below the intro as `<!-- q -->` markers + `- [x]` option lines — that's source data for the DB
 * sync (scripts/sync-tests.mjs), rendered interactively from the DB, not prose. Only the intro
 * before the first marker is display content. A no-op for lectures (no marker).
 */
export function stripTestQuestions(body: string): string {
  const match = body.match(TEST_QUESTION_MARKER_RE)
  if (!match) return body
  const intro = body.slice(0, match.index).replace(/\s+$/, '')
  return intro ? intro + '\n' : ''
}

/**
 * Parse a lesson's `faq` rows out of its own `.md` frontmatter. Server-only: the faq feeds
 * JSON-LD (an SSR/SEO concern — it is never rendered on the page), so the YAML parser is
 * dynamically imported behind an `import.meta.env.SSR` guard and tree-shaken out of the
 * client bundle. Returns null on the client, when there is no frontmatter, or when the
 * lesson declares no faq.
 */
export async function parseLessonFaq(raw: string): Promise<LessonFaqItem[] | null> {
  if (!import.meta.env.SSR) return null
  const match = raw.match(FRONTMATTER_CAPTURE)
  if (!match) return null
  const { parse } = await import('yaml')
  const data = parse(match[1]) as { faq?: unknown } | null
  if (!data || !Array.isArray(data.faq)) return null
  const rows = data.faq
    .map((row) => row as Record<string, unknown>)
    .filter((row) => typeof row?.question === 'string' && typeof row?.answer === 'string')
    .map((row) => ({ question: row.question as string, answer: row.answer as string }))
  return rows.length ? rows : null
}
