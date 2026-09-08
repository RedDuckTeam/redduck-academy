// Imported by vite.config.ts, so this module must stay pure strings: no app, React or browser
// imports.

export const CONTENT_ASSET_PREFIX = '/_content/'

export const COURSES_INDEX_ASSET = `${CONTENT_ASSET_PREFIX}_courses.json`

export function courseManifestPath(courseSlug: string): string {
  return `${CONTENT_ASSET_PREFIX}${encodeURI(courseSlug)}/_manifest.json`
}

export function contentAssetPath(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `${CONTENT_ASSET_PREFIX}${encodeURI(`${courseSlug}/${moduleSlug}/${lessonSlug}`)}.md`
}

export function lessonPath(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `/courses/${courseSlug}/${moduleSlug}/${lessonSlug}`
}
