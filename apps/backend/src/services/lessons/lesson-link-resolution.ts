import { inArray } from 'drizzle-orm'
import { cache } from '../../lib/cache'
import { payloadDb } from '../../db'
import { payloadSchema } from '@redduck/payload-config'

const { lessons } = payloadSchema

export const LESSON_NAV_CACHE_TTL_SEC = 600

export type LessonNavigation = {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
}

function parseLessonDocId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number.parseInt(value, 10)
  return null
}

function visitLexicalNodes(node: unknown, visit: (n: Record<string, unknown>) => void): void {
  if (node == null || typeof node !== 'object') return
  const n = node as Record<string, unknown>
  visit(n)
  const children = n.children
  if (!Array.isArray(children)) return
  for (const child of children) visitLexicalNodes(child, visit)
}

export function collectLessonLinkIds(content: unknown): number[] {
  if (content == null || typeof content !== 'object') return []
  const root = (content as Record<string, unknown>).root
  if (root == null) return []

  const ids = new Set<number>()
  visitLexicalNodes(root, (n) => {
    if (n.type !== 'link') return
    const fields = n.fields as Record<string, unknown> | undefined
    if (!fields || fields.linkType !== 'internal') return
    const doc = fields.doc as Record<string, unknown> | undefined
    if (!doc || doc.relationTo !== 'lessons') return
    const id = parseLessonDocId(doc.value)
    if (id != null) ids.add(id)
  })
  return [...ids]
}

function walkAndEnrich(node: unknown, map: Map<number, LessonNavigation>): void {
  if (node == null || typeof node !== 'object') return
  const n = node as Record<string, unknown>
  if (n.type === 'link') {
    const fields = n.fields as Record<string, unknown> | undefined
    if (fields?.linkType === 'internal') {
      const doc = fields.doc as Record<string, unknown> | undefined
      if (doc?.relationTo === 'lessons') {
        const id = parseLessonDocId(doc.value)
        if (id != null) {
          const nav = map.get(id)
          if (nav) {
            const href = `/courses/${nav.courseSlug}/${nav.moduleSlug}/${nav.lessonSlug}`
            doc.href = href
            doc.navigation = { ...nav }
          }
        }
      }
    }
  }
  const children = n.children
  if (!Array.isArray(children)) return
  for (const child of children) walkAndEnrich(child, map)
}

export async function getLessonNavigationByIds(ids: number[]): Promise<Map<number, LessonNavigation>> {
  const map = new Map<number, LessonNavigation>()
  if (ids.length === 0) return map

  const missing: number[] = []
  for (const id of ids) {
    const key = `lesson:nav:${id}`
    const hit = await cache.get<LessonNavigation>(key)
    if (hit) map.set(id, hit)
    else missing.push(id)
  }

  if (missing.length === 0) return map

  const uniqueMissing = [...new Set(missing)]
  const rows = await payloadDb.query.lessons.findMany({
    where: inArray(lessons.id, uniqueMissing),
    columns: { id: true, slug: true },
    with: {
      module: {
        columns: { slug: true },
        with: {
          course: { columns: { slug: true } },
        },
      },
    },
  })

  for (const row of rows) {
    const courseSlug = row.module?.course?.slug
    const moduleSlug = row.module?.slug
    const lessonSlug = row.slug
    if (!courseSlug || !moduleSlug || !lessonSlug) continue
    const nav: LessonNavigation = { courseSlug, moduleSlug, lessonSlug }
    map.set(row.id, nav)
    await cache.set(`lesson:nav:${row.id}`, nav, LESSON_NAV_CACHE_TTL_SEC)
  }

  return map
}

export async function enrichLessonContentInternalLinks(content: unknown): Promise<unknown> {
  if (content == null) return content
  if (typeof content !== 'object') return content

  const ids = collectLessonLinkIds(content)
  if (ids.length === 0) return content

  const navMap = await getLessonNavigationByIds(ids)
  const clone = structuredClone(content) as Record<string, unknown>
  const root = clone.root
  if (root != null) walkAndEnrich(root, navMap)
  return clone
}
