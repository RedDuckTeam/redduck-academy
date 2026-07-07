import type { CommunityEvent } from '@/types/community'
import type { Course, Lesson } from '@/types/lesson'
import { env } from '@/env'

const SITE_NAME = 'RedDuck Academy'
const SITE_DESCRIPTION =
  'Learn blockchain development with RedDuck Academy. Interactive courses, coding challenges, and hands-on projects.'
const OG_IMAGE_URL = 'https://redduck.io/thumbnail.png'

const META_DESCRIPTION_MAX_LENGTH = 160

function getBaseUrl(): string {
  const url = env.VITE_APP_URL.replace(/\/$/, '')
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

/** Resolve a site-relative path to an absolute URL. */
export function absoluteUrl(path: string): string {
  return `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

/** Normalise a DB timestamp (raw Postgres or ISO) to valid ISO 8601, or undefined. */
function toIsoDate(value?: string): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

/**
 * Extracts plain text from rich content (Markdoc, Lexical, etc.) for meta descriptions.
 */
function extractPlainText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) {
    return value.map(extractPlainText).filter(Boolean).join(' ')
  }
  if (typeof value === 'object' && value !== null) {
    if ('text' in value && typeof (value as { text: unknown }).text === 'string') {
      return (value as { text: string }).text.trim()
    }
    if ('children' in value) {
      return extractPlainText((value as { children: unknown }).children)
    }
    return Object.values(value).map(extractPlainText).filter(Boolean).join(' ')
  }
  return ''
}

function truncateDescription(text: string, maxLength = META_DESCRIPTION_MAX_LENGTH): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return trimmed.slice(0, maxLength - 3) + '...'
}

export type HeadMeta = {
  title?: string
  name?: string
  content?: string
  property?: string
  charSet?: string
}

export type HeadLinks = {
  rel?: string
  href?: string
  type?: string
  sizes?: string
  as?: string
  crossOrigin?: '' | 'anonymous' | 'use-credentials'
}

export type HeadConfig = {
  meta?: HeadMeta[]
  links?: HeadLinks[]
}

/**
 * Base meta tags for all pages. Used in root route.
 */
export function createDefaultMeta(): HeadConfig {
  return {
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: SITE_NAME },
      { name: 'description', content: SITE_DESCRIPTION },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: SITE_NAME },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: OG_IMAGE_URL },
      { property: 'og:image:alt', content: SITE_NAME },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: SITE_NAME },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
      { name: 'twitter:image', content: OG_IMAGE_URL },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }
}

/**
 * Generic meta for static pages (index, sign-up, etc.).
 */
export function createPageMeta({
  title,
  description,
  path,
}: {
  title: string
  description?: string
  path?: string
}): HeadConfig {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
  const desc = description ?? SITE_DESCRIPTION
  const canonicalUrl = path ? `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}` : undefined

  const meta: HeadMeta[] = [
    { title: fullTitle },
    { name: 'description', content: desc },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: desc },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: OG_IMAGE_URL },
    { property: 'og:image:alt', content: fullTitle },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: desc },
    { name: 'twitter:image', content: OG_IMAGE_URL },
  ]
  if (canonicalUrl) meta.push({ property: 'og:url', content: canonicalUrl })

  const config: HeadConfig = { meta }
  if (canonicalUrl) config.links = [{ rel: 'canonical', href: canonicalUrl }]

  return config
}

/**
 * Dynamic meta for lesson pages.
 */
export function createLessonMeta({
  lesson,
  courseSlug,
  moduleSlug,
  lessonSlug,
}: {
  lesson: Lesson
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
}): HeadConfig {
  const fullTitle = `${lesson.title} | ${SITE_NAME}`
  const rawDescription = lesson.content ? extractPlainText(lesson.content) : ''
  const description = rawDescription ? truncateDescription(rawDescription) : lesson.title
  const canonicalUrl = `${getBaseUrl()}/courses/${courseSlug}/${moduleSlug}/${lessonSlug}`

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: description },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: OG_IMAGE_URL },
      { property: 'og:image:alt', content: lesson.title },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: OG_IMAGE_URL },
    ],
    links: [
      { rel: 'canonical', href: canonicalUrl },
      // The same URL serves Markdown via content negotiation (see src/start.ts).
      { rel: 'alternate', type: 'text/markdown', href: canonicalUrl },
    ],
  }
}

/**
 * Meta for courses index page.
 */
export function createCommunityEventMeta({
  event,
  slug,
}: {
  event: CommunityEvent
  slug: string
}): HeadConfig {
  const fullTitle = `${event.title} | ${SITE_NAME}`
  const fromContent = event.content ? extractPlainText(event.content) : ''
  const rawDescription = event.description?.trim() || fromContent
  const description = rawDescription ? truncateDescription(rawDescription) : event.title
  const canonicalUrl = `${getBaseUrl()}/community/${slug}`

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: description },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: OG_IMAGE_URL },
      { property: 'og:image:alt', content: event.title },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: OG_IMAGE_URL },
    ],
    links: [{ rel: 'canonical', href: canonicalUrl }],
  }
}

export function createCourseCertificateMeta({
  courseTitle,
  courseSlug,
}: {
  courseTitle: string
  courseSlug: string
}): HeadConfig {
  const title = `Certificate — ${courseTitle}`
  const description = `Course completion certificate for ${courseTitle} at ${SITE_NAME}.`
  const path = `/courses/${courseSlug}/certificate`
  return createPageMeta({ title, description, path })
}

export function createCoursesMeta({
  courses = [],
  focusedCourse,
}: {
  courses?: Course[]
  /** When set (valid slug on /courses), title/description/canonical target that course. */
  focusedCourse?: Course
} = {}): HeadConfig {
  if (focusedCourse) {
    const title = focusedCourse.title
    const rawDescription = focusedCourse.description?.trim() || ''
    const description = rawDescription
      ? truncateDescription(rawDescription)
      : `Explore ${focusedCourse.title} — blockchain development course at ${SITE_NAME}.`
    const path = `/courses/${encodeURIComponent(focusedCourse.slug)}`
    return createPageMeta({ title, description, path })
  }

  const title = 'Courses'
  const courseCount = courses.length
  const description =
    courseCount > 0
      ? `Browse ${courseCount} blockchain development ${courseCount === 1 ? 'course' : 'courses'} at ${SITE_NAME}.`
      : `Browse blockchain development courses at ${SITE_NAME}.`

  return createPageMeta({
    title,
    description,
    path: '/courses',
  })
}

// ---- Structured data (schema.org JSON-LD) ----------------------------------
// Emitted via the <JsonLd> component on SSR'd pages so Google and AI crawlers
// get an explicit, machine-readable description of the site and its content.

type JsonLdObject = Record<string, unknown>

/** A reusable reference to the publishing organization. */
function organizationRef(): JsonLdObject {
  return { '@type': 'Organization', name: SITE_NAME, url: getBaseUrl() }
}

/** Sitewide publisher identity. Rendered once in the root route. */
export function buildOrganizationLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: getBaseUrl(),
    logo: OG_IMAGE_URL,
    description: SITE_DESCRIPTION,
  }
}

/** Sitewide website node. Rendered once in the root route. */
export function buildWebSiteLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: getBaseUrl(),
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: organizationRef(),
  }
}

/** schema.org/Course for a course hub page. */
export function buildCourseLd({ course }: { course: Course }): JsonLdObject {
  const url = `${getBaseUrl()}/courses/${course.slug}`
  const description = course.description?.trim()
    ? truncateDescription(course.description, 500)
    : `Learn ${course.title} — blockchain development course at ${SITE_NAME}.`
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description,
    url,
    inLanguage: 'en',
    provider: organizationRef(),
    dateModified: toIsoDate(course.updatedAt),
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
      category: 'Free',
    },
    ...(course.modules?.length
      ? {
          syllabusSections: course.modules.map((m) => ({
            '@type': 'Syllabus',
            name: m.title,
          })),
        }
      : {}),
  }
}

/** schema.org/Article for a lesson, linked to its parent course. */
export function buildLessonLd({
  lesson,
  courseTitle,
  courseSlug,
  moduleSlug,
  lessonSlug,
}: {
  lesson: Lesson
  courseTitle: string
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
}): JsonLdObject {
  const base = getBaseUrl()
  const url = `${base}/courses/${courseSlug}/${moduleSlug}/${lessonSlug}`
  const courseUrl = `${base}/courses/${courseSlug}`
  const raw = lesson.content ? extractPlainText(lesson.content) : ''
  const description = raw ? truncateDescription(raw, 500) : lesson.title
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: lesson.title,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: 'en',
    datePublished: toIsoDate(lesson.createdAt),
    dateModified: toIsoDate(lesson.updatedAt),
    author: organizationRef(),
    publisher: organizationRef(),
    image: OG_IMAGE_URL,
    isPartOf: { '@type': 'Course', name: courseTitle, url: courseUrl },
  }
}

/**
 * schema.org/FAQPage from a lesson's admin-authored FAQ rows, or null when the
 * lesson has none. The Q&A is deliberately not rendered on the page — the FAQ
 * targets AI crawlers (JSON-LD here, `## FAQ` in the Markdown representation).
 */
export function buildLessonFaqLd({ lesson }: { lesson: Lesson }): JsonLdObject | null {
  const rows = (lesson.faq ?? []).filter((f) => f.question?.trim() && f.answer?.trim())
  if (rows.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: rows.map((f) => ({
      '@type': 'Question',
      name: f.question.trim(),
      acceptedAnswer: { '@type': 'Answer', text: f.answer.trim() },
    })),
  }
}

/** schema.org/BreadcrumbList mirroring the on-page breadcrumb trail. */
export function buildBreadcrumbLd(items: { name: string; url?: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  }
}
