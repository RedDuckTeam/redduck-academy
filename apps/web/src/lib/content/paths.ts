// Path constants shared between the build (vite.config `contentAssets` plugin, which
// emits the content Markdown) and runtime (loader, which fetches it). Keep them here so
// the emitter and the fetcher can never disagree on the prefix.
//
// Pure strings only — this module is imported by vite.config.ts, so it must not pull in
// any app/React/browser code.

export const CONTENT_ASSET_PREFIX = '/_content/'

/** URL of the all-courses structure index (every course, no per-lesson prose or faq). */
export const COURSES_INDEX_ASSET = `${CONTENT_ASSET_PREFIX}_courses.json`

/** URL of a single course's structure manifest (its modules/lessons + per-lesson faq). */
export function courseManifestPath(courseSlug: string): string {
  return `${CONTENT_ASSET_PREFIX}${encodeURI(courseSlug)}/_manifest.json`
}

/** URL of a lesson's Markdown static asset, e.g. /_content/basics/crypto/hashing.md */
export function contentAssetPath(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `${CONTENT_ASSET_PREFIX}${encodeURI(`${courseSlug}/${moduleSlug}/${lessonSlug}`)}.md`
}

/** Canonical lesson route path, e.g. /courses/basics/crypto/hashing */
export function lessonPath(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `/courses/${courseSlug}/${moduleSlug}/${lessonSlug}`
}
