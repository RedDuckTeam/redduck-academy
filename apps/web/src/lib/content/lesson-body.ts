import { contentAssetPath } from './paths'
import { stripFrontmatter, stripTestQuestions, parseLessonFaq } from './frontmatter'
import { fetchContentAsset } from './asset-fetch'
import type { LessonFaqItem } from '@/types/lesson'

export interface LessonContent {
  body: string
  faq: LessonFaqItem[] | null
}

export function lessonBodyFromSource(raw: string): string {
  return stripTestQuestions(stripFrontmatter(raw))
}

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
