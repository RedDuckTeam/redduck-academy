import type { LessonFaqItem } from '@/types/lesson'

export const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/
const FRONTMATTER_CAPTURE = /^---\r?\n([\s\S]*?)\r?\n---/

export function stripFrontmatter(raw: string): string {
  const match = raw.match(FRONTMATTER_RE)
  return match ? raw.slice(match[0].length) : raw
}

// `scripts/lib/tests-md.mjs` matches this same marker in the content pipeline; the two must stay
// in step.
export const TEST_QUESTION_MARKER_RE = /^[ \t]*<!--\s*q(?::\s*[^\s>]+)?\s*-->[ \t]*$/m

export function stripTestQuestions(body: string): string {
  const match = body.match(TEST_QUESTION_MARKER_RE)
  if (!match) return body
  const intro = body.slice(0, match.index).replace(/\s+$/, '')
  return intro ? intro + '\n' : ''
}

// The `yaml` parser is dynamically imported behind the SSR guard so it is tree-shaken out of the
// client bundle; the faq feeds SSR JSON-LD and is never rendered on the page.
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
