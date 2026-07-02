import { createMiddleware, createStart } from '@tanstack/react-start'
import { getLesson } from '@/lib/api/courses'
import { lexicalToMarkdown } from '@/lib/lexical-to-markdown'

// Content negotiation for AI agents: serve a lesson as Markdown (with diagram
// descriptions) at the *same URL* as its HTML page when the request asks for
// `Accept: text/markdown`. Anything else passes straight through to normal
// rendering, so this only ever adds a response — it never changes the HTML site.
const LESSON_PATH = /^\/courses\/([^/]+)\/[^/]+\/([^/]+)\/?$/
const CACHE_TTL_SECONDS = 6 * 60 * 60

const markdownForAgents = createMiddleware({ type: 'request' }).server(async ({ request, pathname, next }) => {
  const wantsMarkdown = (request.headers.get('accept') ?? '').includes('text/markdown')
  const lesson = wantsMarkdown ? LESSON_PATH.exec(pathname) : null
  if (lesson) {
    try {
      const { data } = await getLesson(decodeURIComponent(lesson[1]), decodeURIComponent(lesson[2]))
      const markdown = `# ${data.title}\n\n${lexicalToMarkdown(data.content)}\n`
      return new Response(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          Vary: 'Accept',
          'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}`,
        },
      })
    } catch {
      // On any failure, fall through to the normal HTML response.
    }
  }
  return next()
})

export const startInstance = createStart(() => ({
  requestMiddleware: [markdownForAgents],
}))
