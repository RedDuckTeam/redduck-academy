import { contentAssetPath } from './paths'
import { stripFrontmatter, stripTestQuestions, parseLessonFaq } from './frontmatter'
import { fetchContentAsset } from './asset-fetch'
import type { LessonFaqItem } from '@/types/lesson'

export interface LessonContent {
  body: string
  faq: LessonFaqItem[] | null
}

/**
 * The body the site renders, from a lesson's raw `.md`: frontmatter is metadata and a test
 * lesson's question block is source data for the DB sync, so neither is prose. The editor's
 * preview renders through this too, so what it shows cannot drift from the published page.
 */
export function lessonBodyFromSource(raw: string): string {
  return stripTestQuestions(stripFrontmatter(raw))
}

// Fetches a lesson's Markdown from the `/_content/**/*.md` static assets (emitted by the
// `content-assets` Vite plugin) in ONE request, returning both the body (frontmatter
// stripped) and the faq (parsed from that same frontmatter, server-side only — see
// parseLessonFaq). Run this in the route loader. Returns null when the file does not
// exist, so the caller can fall back to the DB Lexical content.
export async function loadLessonContent(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
): Promise<LessonContent | null> {
  const res = await fetchContentAsset(contentAssetPath(courseSlug, moduleSlug, lessonSlug))
  if (!res || !res.ok) return null
  const raw = await res.text()
  return { body: lessonBodyFromSource(raw), faq: await parseLessonFaq(raw) }
}
