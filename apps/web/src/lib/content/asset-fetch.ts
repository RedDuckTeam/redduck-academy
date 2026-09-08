type AssetsBinding = { fetch: (request: Request) => Promise<Response> }

export async function fetchContentAsset(assetPath: string): Promise<Response | null> {
  try {
    if (import.meta.env.SSR) {
      // A Worker's same-origin fetch of its own static asset is not reliably served back to it,
      // hence the ASSETS binding. Skipped in dev, where the dev Worker has no built assets and the
      // binding 403s.
      if (!import.meta.env.DEV) {
        // Dynamic specifier so the client build never tries to resolve this Worker-only module.
        const workersModule = 'cloudflare:workers'
        const { env } = (await import(/* @vite-ignore */ workersModule)) as {
          env: { ASSETS?: AssetsBinding }
        }
        if (env.ASSETS) {
          return await env.ASSETS.fetch(new Request(`https://assets.local${assetPath}`))
        }
      }
      const { getRequestUrl } = await import('@tanstack/react-start/server')
      return await fetch(new URL(assetPath, getRequestUrl()))
    }
    return await fetch(assetPath)
  } catch {
    return null
  }
}
