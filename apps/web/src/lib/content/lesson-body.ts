import { contentAssetPath } from './paths'
import { stripFrontmatter } from './frontmatter'

// Fetches a lesson's Markdown body from the `/_content/**/*.md` static assets (emitted
// by the `content-assets` Vite plugin). Run this in the route loader:
//   • On the server it resolves the asset against the current request origin.
//   • On the client (navigation) it fetches the CDN asset directly.
// Either way the content never enters the JS bundle or the Worker script.

export async function loadLessonBody(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
): Promise<string | null> {
  const assetPath = contentAssetPath(courseSlug, moduleSlug, lessonSlug)
  try {
    let url: string | URL = assetPath
    if (import.meta.env.SSR) {
      // Server-only import; tree-shaken out of the client bundle.
      const { getRequestUrl } = await import('@tanstack/react-start/server')
      url = new URL(assetPath, getRequestUrl())
    }
    const res = await fetch(url)
    if (!res.ok) return null
    return stripFrontmatter(await res.text())
  } catch {
    return null
  }
}
