import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/env'
import { getCourses } from '@/lib/api/courses'
import { getCommunityEvents } from '@/lib/api/community'

const CACHE_TTL_SECONDS = 6 * 60 * 60 // 6 hours fresh
const STALE_WHILE_REVALIDATE_SECONDS = 24 * 60 * 60 // 24h serve-stale grace
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000

let cache: { xml: string; expiresAt: number } | null = null

function baseUrl(): string {
  return env.VITE_APP_URL.replace(/\/$/, '')
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

interface UrlEntry {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

function renderUrl({ loc, lastmod, changefreq, priority }: UrlEntry): string {
  const parts = [`  <url>`, `    <loc>${escapeXml(loc)}</loc>`]
  if (lastmod) parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`)
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`)
  if (priority !== undefined) parts.push(`    <priority>${priority.toFixed(1)}</priority>`)
  parts.push(`  </url>`)
  return parts.join('\n')
}

async function buildSitemap(): Promise<string> {
  const site = baseUrl()
  const urls: UrlEntry[] = [
    { loc: `${site}/`, changefreq: 'weekly', priority: 1.0 },
    { loc: `${site}/dashboard`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${site}/courses`, changefreq: 'weekly', priority: 0.9 },
    { loc: `${site}/ranking`, changefreq: 'daily', priority: 0.5 },
  ]

  const [coursesRes, eventsRes] = await Promise.allSettled([getCourses(), getCommunityEvents()])

  if (coursesRes.status === 'fulfilled') {
    for (const course of coursesRes.value.data) {
      urls.push({
        loc: `${site}/courses/${course.slug}`,
        lastmod: course.updatedAt,
        changefreq: 'weekly',
        priority: 0.8,
      })
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          urls.push({
            loc: `${site}/courses/${course.slug}/${module.slug}/${lesson.slug}`,
            lastmod: lesson.updatedAt,
            changefreq: 'monthly',
            priority: 0.7,
          })
        }
      }
    }
  }

  if (eventsRes.status === 'fulfilled') {
    for (const event of eventsRes.value.data) {
      if (!event.slug) continue
      urls.push({
        loc: `${site}/community/${event.slug}`,
        lastmod: event.updatedAt,
        changefreq: 'monthly',
        priority: 0.6,
      })
    }
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls.map(renderUrl),
    `</urlset>`,
  ].join('\n')
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const now = Date.now()
        if (!cache || cache.expiresAt < now) {
          const xml = await buildSitemap()
          cache = { xml, expiresAt: now + CACHE_TTL_MS }
        }
        return new Response(cache.xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
          },
        })
      },
    },
  },
})
