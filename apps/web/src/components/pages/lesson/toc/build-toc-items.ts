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
  const slugCounts = new Map<string, number>()

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: string; tag?: string; children?: unknown[] }
    if (n.type === 'heading' && (n.tag === 'h1' || n.tag === 'h2' || n.tag === 'h3')) {
      const text = extractText(n).trim()
      if (text) {
        const baseSlug = slugify(text)
        const count = slugCounts.get(baseSlug) ?? 0
        slugCounts.set(baseSlug, count + 1)
        const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`
        headings.push({ id, tag: n.tag, text })
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

const tagToLevel = { h1: 1, h2: 2, h3: 3 } as const

function truncate(text: string, max = 50): string {
  const trimmed = text.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed
}

export function buildTocItems(lesson: Lesson): TocItem[] {
  const items: TocItem[] = []
  const headings = extractContentHeadings(lesson.content)
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
