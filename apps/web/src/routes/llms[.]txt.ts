import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/env'
import { LINKS } from '@/constants/links'
import { getCourses } from '@/lib/api/courses'
import { getCommunityEvents } from '@/lib/api/community'

const CACHE_TTL_SECONDS = 6 * 60 * 60 // 6 hours fresh
const STALE_WHILE_REVALIDATE_SECONDS = 24 * 60 * 60 // 24h serve-stale grace
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000

let cache: { text: string; expiresAt: number } | null = null

function baseUrl(): string {
  return env.VITE_APP_URL.replace(/\/$/, '')
}

/** Collapse whitespace/newlines so a description stays on a single markdown line. */
function oneLine(str: string): string {
  return str.replace(/\s+/g, ' ').trim()
}

function link(title: string, url: string, description?: string): string {
  const base = `- [${title}](${url})`
  return description ? `${base}: ${oneLine(description)}` : base
}

async function buildLlmsTxt(): Promise<string> {
  const site = baseUrl()
  const lines: string[] = [
    '# RedDuck Academy',
    '',
    '> Free, hands-on Web3 and Solidity education: interactive courses, in-browser coding tasks, on-chain projects, and certificates.',
    '',
    '> Any lesson page also serves clean Markdown — request its URL with the `Accept: text/markdown` header.',
    '',
    '## Key pages',
    '',
    link('Home', `${site}/`, 'Platform overview'),
    link('All courses', `${site}/courses`, 'Full course catalog'),
    link('Ranking', `${site}/ranking`, 'Learner leaderboard'),
    link('Privacy Policy', LINKS.PrivacyPolicy),
  ]

  const [coursesRes, eventsRes] = await Promise.allSettled([getCourses(), getCommunityEvents()])

  if (coursesRes.status === 'fulfilled') {
    const courses = coursesRes.value.data

    lines.push('', '## Courses', '')
    for (const course of courses) {
      lines.push(link(course.title, `${site}/courses/${course.slug}`, course.description))
    }

    for (const course of courses) {
      lines.push('', `## ${course.title}`, '')
      if (course.description) lines.push(`> ${oneLine(course.description)}`, '')
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          lines.push(
            link(
              `${module.title}: ${lesson.title}`,
              `${site}/courses/${course.slug}/${module.slug}/${lesson.slug}`,
            ),
          )
        }
      }
    }
  }

  if (eventsRes.status === 'fulfilled') {
    const events = eventsRes.value.data.filter((e) => e.slug)
    if (events.length > 0) {
      lines.push('', '## Community', '')
      for (const event of events) {
        lines.push(link(event.title, `${site}/community/${event.slug}`, event.description))
      }
    }
  }

  return lines.join('\n') + '\n'
}

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: async () => {
        const now = Date.now()
        if (!cache || cache.expiresAt < now) {
          const text = await buildLlmsTxt()
          cache = { text, expiresAt: now + CACHE_TTL_MS }
        }
        return new Response(cache.text, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
          },
        })
      },
    },
  },
})
