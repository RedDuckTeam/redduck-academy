import { fromMarkdown } from 'mdast-util-from-markdown'
import { toString as mdastToString } from 'mdast-util-to-string'
import type { Lesson } from '@/types/lesson'

export interface TocItem {
  id: string
  label: string
  level: 1 | 2 | 3
}

export interface ContentHeading {
  id: string
  tag: 'h1' | 'h2' | 'h3'
  text: string
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
  return slug || 'section'
}

/**
 * Returns a stateful function that maps heading text to a slug id, de-duplicating repeats
 * in document order (`foo`, `foo-2`, `foo-3`, …). Single source of truth for the heading
 * id contract: MarkdownContent, the Lexical RichText renderer, and both TOC extractors
 * must all produce identical ids, so they share this.
 */
export function createSlugDeduper(): (text: string) => string {
  const counts = new Map<string, number>()
  return (text: string) => {
    const base = slugify(text)
    const n = counts.get(base) ?? 0
    counts.set(base, n + 1)
    return n === 0 ? base : `${base}-${n + 1}`
  }
}

export function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: unknown; children?: unknown[] }
  if (typeof n.text === 'string') return n.text
  if (Array.isArray(n.children)) return n.children.map(extractText).join('')
  return ''
}

export function extractContentHeadings(data: unknown): ContentHeading[] {
  if (!data) return []
  const headings: ContentHeading[] = []
  const nextId = createSlugDeduper()

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: string; tag?: string; children?: unknown[] }
    if (n.type === 'heading' && (n.tag === 'h1' || n.tag === 'h2' || n.tag === 'h3')) {
      const text = extractText(n).trim()
      if (text) {
        headings.push({ id: nextId(text), tag: n.tag, text })
      }
    }
    if (Array.isArray(n.children)) {
      for (const child of n.children) walk(child)
    }
  }

  const root = (data as { root?: unknown }).root ?? data
  walk(root)
  return headings
}

/**
 * Markdown-native equivalent of extractContentHeadings. Parses with the same mdast
 * machinery react-markdown uses, so the ids here match the heading ids MarkdownContent
 * renders (same slugify + document-order dedup across h1–h3).
 */
export function extractMarkdownHeadings(markdown: string): ContentHeading[] {
  if (!markdown) return []
  const tree = fromMarkdown(markdown)
  const headings: ContentHeading[] = []
  const nextId = createSlugDeduper()

  const walk = (node: { type?: string; depth?: number; children?: unknown[] }) => {
    if (node.type === 'heading' && node.depth && node.depth >= 1 && node.depth <= 3) {
      const text = mdastToString(node).trim()
      if (text) {
        headings.push({ id: nextId(text), tag: `h${node.depth}` as ContentHeading['tag'], text })
      }
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child as { type?: string; children?: unknown[] })
    }
  }
  walk(tree as { children?: unknown[] })
  return headings
}

const tagToLevel = { h1: 1, h2: 2, h3: 3 } as const

function truncate(text: string, max = 50): string {
  const trimmed = text.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed
}

export function buildTocItems(lesson: Lesson, markdownBody?: string): TocItem[] {
  const items: TocItem[] = []
  // Prefer headings from the open-source Markdown body; fall back to the DB Lexical.
  const headings =
    markdownBody != null ? extractMarkdownHeadings(markdownBody) : extractContentHeadings(lesson.content)
  for (const h of headings) {
    items.push({ id: h.id, label: h.text, level: tagToLevel[h.tag] })
  }
  if (lesson.type === 'test' && lesson.questions?.length) {
    for (const q of lesson.questions) {
      const root = (q.question as { root?: unknown } | null)?.root ?? q.question
      const plain = extractText(root).trim()
      items.push({
        id: `question-${q.order}`,
        label: `Q${q.order}: ${truncate(plain)}`,
        level: 1,
      })
    }
  }
  if (lesson.type === 'review_task') {
    items.push({ id: 'submit', label: 'Submit', level: 1 })
  }
  return items
}
