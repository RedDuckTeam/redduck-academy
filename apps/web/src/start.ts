import { createMiddleware, createStart } from '@tanstack/react-start'
import { getLesson } from '@/lib/api/courses'
import { lessonToMarkdownDoc } from '@/lib/lexical-to-markdown'

// Content negotiation for AI agents: serve a lesson as Markdown (with diagram
// descriptions + a Source line) at the same URL as its HTML page when the request
// asks for `Accept: text/markdown`. For a markdown request we can't satisfy (any
// non-lesson page, or a failed fetch) we answer with a clean 406 — TanStack's
// document handler otherwise 500s on a non-HTML Accept, and it ignores
// request-middleware request overrides so we can't make it render HTML instead.
// Non-markdown requests pass through; lesson HTML responses get `Vary: Accept`
// so shared caches keep the two representations apart.
const LESSON_PATH = /^\/courses\/([^/]+)\/[^/]+\/([^/]+)\/?$/
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

const markdownForAgents = createMiddleware({ type: 'request' }).server(async ({ request, pathname, next }) => {
  const wantsMarkdown = (request.headers.get('accept') ?? '').includes('text/markdown')
  if (!wantsMarkdown) {
    const result = await next()
    if (LESSON_PATH.test(pathname)) addVaryAccept(result.response)
    return result
  }

  const lesson = LESSON_PATH.exec(pathname)
  if (lesson) {
    try {
      const { data } = await getLesson(decodeURIComponent(lesson[1]), decodeURIComponent(lesson[2]))
      const { origin } = new URL(request.url)
      return new Response(lessonToMarkdownDoc(data.title, `${origin}${pathname}`, data.content, data.faq), {
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

export const startInstance = createStart(() => ({
  requestMiddleware: [markdownForAgents],
}))
