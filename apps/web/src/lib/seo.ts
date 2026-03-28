import type { CommunityEvent } from '@/types/community'
import type { Course, Lesson } from '@/types/lesson'
import { env } from '@/env'

const SITE_NAME = 'RedDuck Academy'
const SITE_DESCRIPTION =
  'Learn blockchain development with RedDuck Academy. Interactive courses, coding challenges, and hands-on projects.'

const META_DESCRIPTION_MAX_LENGTH = 160

function getBaseUrl(): string {
  return env.VITE_APP_URL.replace(/\/$/, '')
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
      { property: 'og:title', content: SITE_NAME },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: SITE_NAME },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
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

  const config: HeadConfig = {
    meta: [
      { title: fullTitle },
      { name: 'description', content: desc },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: desc },
    ],
  }

  if (path) {
    config.links = [{ rel: 'canonical', href: `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}` }]
  }

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
  const canonicalPath = `/courses/${courseSlug}/${moduleSlug}/${lessonSlug}`

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: description },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: `${getBaseUrl()}${canonicalPath}` }],
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
  const canonicalPath = `/community/${slug}`

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: description },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: `${getBaseUrl()}${canonicalPath}` }],
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
