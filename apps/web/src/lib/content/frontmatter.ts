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
