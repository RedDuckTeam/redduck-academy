import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/env'
import { getCourses, getLesson } from '@/lib/api/courses'
import { lessonToMarkdownDoc } from '@/lib/lexical-to-markdown'

// The entire public course corpus as one Markdown file, so an agent can pull it
// in a single request. Each lesson carries a Source URL for attribution.
const CACHE_TTL_SECONDS = 6 * 60 * 60
const STALE_WHILE_REVALIDATE_SECONDS = 24 * 60 * 60
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000
const FETCH_CONCURRENCY = 8

let cache: { text: string; expiresAt: number } | null = null

function baseUrl(): string {
  return env.VITE_APP_URL.replace(/\/$/, '')
}

/** Run `fn` over `items` with at most `limit` in flight — kind to the backend. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function buildLlmsFull(): Promise<string> {
  const site = baseUrl()
  const { data: courses } = await getCourses()

  const targets = courses.flatMap((course) =>
    course.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({ course: course.slug, module: module.slug, lesson: lesson.slug })),
    ),
  )

  const sections = await mapLimit(targets, FETCH_CONCURRENCY, async (t) => {
    try {
      const { data } = await getLesson(t.course, t.lesson)
      return lessonToMarkdownDoc(data.title, `${site}/courses/${t.course}/${t.module}/${t.lesson}`, data.content, data.faq)
    } catch {
      return ''
    }
  })

  const header = [
    '# RedDuck Academy — full course content',
    '',
    '> Every public lesson as Markdown. Each lesson lists its Source URL for citation.',
    '',
  ]
  return header.join('\n') + '\n' + sections.filter(Boolean).join('\n---\n\n') + '\n'
}

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: async () => {
        const now = Date.now()
        if (!cache || cache.expiresAt < now) {
          cache = { text: await buildLlmsFull(), expiresAt: now + CACHE_TTL_MS }
        }
        return new Response(cache.text, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
          },
        })
      },
    },
  },
})
