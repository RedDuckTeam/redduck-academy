// Fetches a static asset under `/_content/*` (a lesson's Markdown, or a structure
// manifest) in whichever environment the caller runs in:
//   • Cloudflare Worker (prod SSR): via the `env.ASSETS` binding — a same-origin fetch of
//     the Worker's own asset is NOT reliably served back to it.
//   • Dev SSR: `env.ASSETS` is absent, so fetch same-origin; the content-assets middleware
//     serves it from disk (or builds the manifest on the fly).
//   • Client (navigation): fetch the CDN asset directly.
// Returns the raw Response, or null on any error / non-OK, so callers can fall back.
// The content never enters the JS bundle or the Worker script.

type AssetsBinding = { fetch: (request: Request) => Promise<Response> }

export async function fetchContentAsset(assetPath: string): Promise<Response | null> {
  try {
    // The SSR branch is dead-code-eliminated from the client build (import.meta.env.SSR),
    // which also strips its server-only imports.
    if (import.meta.env.SSR) {
      // Prod (Cloudflare Worker): read our own static assets via the ASSETS binding — a
      // same-origin fetch of the Worker's own asset is not reliably served back to it.
      // Dev: the dev Worker has no built assets (the ASSETS binding 403s), so fetch
      // same-origin and let the content-assets middleware serve from disk / build the
      // manifest on the fly.
      if (!import.meta.env.DEV) {
        // `cloudflare:workers` is a Worker-runtime virtual module — dynamic specifier so the
        // client build never tries to resolve it.
        const workersModule = 'cloudflare:workers'
        const { env } = (await import(/* @vite-ignore */ workersModule)) as {
          env: { ASSETS?: AssetsBinding }
        }
        if (env.ASSETS) {
          return await env.ASSETS.fetch(new Request(`https://assets.local${assetPath}`))
        }
      }
      // Dev / non-Cloudflare SSR: resolve against the current request origin.
      const { getRequestUrl } = await import('@tanstack/react-start/server')
      return await fetch(new URL(assetPath, getRequestUrl()))
    }
    return await fetch(assetPath)
  } catch {
    return null
  }
}
