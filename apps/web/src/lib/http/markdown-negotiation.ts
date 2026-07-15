import { createMiddleware } from '@tanstack/react-start'
import { buildLessonMarkdownDoc } from '@/lib/content/lesson-markdown'
import { addSecurityHeaders } from '@/lib/http/security-headers'

// Content negotiation for AI agents: serve a lesson as Markdown (with diagram
// descriptions + a Source line) at the same URL as its HTML page when the request
// asks for `Accept: text/markdown`. For a markdown request we can't satisfy (any
// non-lesson page, or a failed fetch) we answer with a clean 406 — TanStack's
// document handler otherwise 500s on a non-HTML Accept, and it ignores
// request-middleware request overrides so we can't make it render HTML instead.
// Non-markdown requests pass through; lesson HTML responses get `Vary: Accept`
// so shared caches keep the two representations apart.
const LESSON_PATH = /^\/courses\/([^/]+)\/([^/]+)\/([^/]+)\/?$/
const CACHE_TTL_SECONDS = 6 * 60 * 60

const markdownHeaders = {
  'Content-Type': 'text/markdown; charset=utf-8',
  Vary: 'Accept',
  'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}`,
}

/** Mark a response as varying on Accept (lesson URLs serve HTML or Markdown). */
function addVaryAccept(response: Response): void {
  const vary = (response.headers.get('vary') ?? '').split(',').map((v) => v.trim().toLowerCase())
  if (vary.includes('accept') || vary.includes('*')) return
  try {
    response.headers.append('Vary', 'Accept')
  } catch {
    // immutable headers (e.g. static asset passthrough) — nothing to do
  }
}

export const markdownForAgents = createMiddleware({ type: 'request' }).server(async ({ request, pathname, next }) => {
  const wantsMarkdown = (request.headers.get('accept') ?? '').includes('text/markdown')
  if (!wantsMarkdown) {
    const result = await next()
    addSecurityHeaders(result.response)
    if (LESSON_PATH.test(pathname)) addVaryAccept(result.response)
    return result
  }

  const lesson = LESSON_PATH.exec(pathname)
  if (lesson) {
    try {
      const [, course, module, lessonSlug] = lesson.map((s) => (s ? decodeURIComponent(s) : s))
      const { origin } = new URL(request.url)
      return new Response(await buildLessonMarkdownDoc(course, module, lessonSlug, `${origin}${pathname}`), {
        headers: markdownHeaders,
      })
    } catch {
      // fall through to the 406 below
    }
  }

  return new Response('No Markdown representation for this URL. Use a lesson URL, or /llms-full.txt for the whole corpus.\n', {
    status: 406,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', Vary: 'Accept' },
  })
})
