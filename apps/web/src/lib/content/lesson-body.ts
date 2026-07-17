import { contentAssetPath } from './paths'
import { stripFrontmatter, stripTestQuestions, parseLessonFaq } from './frontmatter'
import { fetchContentAsset } from './asset-fetch'
import type { LessonFaqItem } from '@/types/lesson'

export interface LessonContent {
  body: string
  faq: LessonFaqItem[] | null
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
  return { body: stripTestQuestions(stripFrontmatter(raw)), faq: await parseLessonFaq(raw) }
}
