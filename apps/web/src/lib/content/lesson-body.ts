import { contentAssetPath } from './paths'
import { stripFrontmatter } from './frontmatter'
import { fetchContentAsset } from './asset-fetch'

// Fetches a lesson's Markdown body from the `/_content/**/*.md` static assets (emitted by
// the `content-assets` Vite plugin). Run this in the route loader. Returns null when the
// file does not exist, so the caller can fall back to the DB Lexical content.
export async function loadLessonBody(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
): Promise<string | null> {
  const res = await fetchContentAsset(contentAssetPath(courseSlug, moduleSlug, lessonSlug))
  if (!res || !res.ok) return null
  return stripFrontmatter(await res.text())
}
