import { contentAssetPath } from './paths'
import { stripFrontmatter } from './frontmatter'

// Fetches a lesson's Markdown body from the `/_content/**/*.md` static assets (emitted by
// the `content-assets` Vite plugin). Run this in the route loader:
//   • On Cloudflare (prod) the Worker reads its own asset via the `env.ASSETS` binding —
//     a same-origin fetch of an asset path is NOT reliably served back to the Worker.
//   • In dev SSR, `env.ASSETS` is absent, so it falls back to a same-origin fetch, which
//     the dev server's content-assets middleware serves from disk.
//   • On the client (navigation) it fetches the CDN asset directly.
// Either way the content never enters the JS bundle or the Worker script.

type AssetsBinding = { fetch: (request: Request) => Promise<Response> }

export async function loadLessonBody(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
): Promise<string | null> {
  const assetPath = contentAssetPath(courseSlug, moduleSlug, lessonSlug)
  try {
    let res: Response
    // The SSR branch is dead-code-eliminated from the client build (import.meta.env.SSR),
    // which also removes its server-only imports.
    if (import.meta.env.SSR) {
      // `cloudflare:workers` is a Worker-runtime virtual module — dynamic specifier so the
      // client build never tries to resolve it.
      const workersModule = 'cloudflare:workers'
      const { env } = (await import(/* @vite-ignore */ workersModule)) as {
        env: { ASSETS?: AssetsBinding }
      }
      if (env.ASSETS) {
        res = await env.ASSETS.fetch(new Request(`https://assets.local${assetPath}`))
      } else {
        // Dev / non-Cloudflare SSR: resolve against the current request origin.
        const { getRequestUrl } = await import('@tanstack/react-start/server')
        res = await fetch(new URL(assetPath, getRequestUrl()))
      }
    } else {
      res = await fetch(assetPath)
    }
    if (!res.ok) return null
    return stripFrontmatter(await res.text())
  } catch {
    return null
  }
}
