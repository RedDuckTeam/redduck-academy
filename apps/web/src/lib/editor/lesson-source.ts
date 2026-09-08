import { contentAssetPath } from '@/lib/content/paths'
import { FRONTMATTER_RE } from '@/lib/content/frontmatter'

export async function loadLessonSource(courseSlug: string, moduleSlug: string, lessonSlug: string): Promise<string> {
  let response: Response
  try {
    response = await fetch(contentAssetPath(courseSlug, moduleSlug, lessonSlug), { cache: 'no-cache' })
  } catch {
    throw new Error(
      navigator.onLine
        ? 'Could not reach the server to load this lesson. Try again in a moment.'
        : 'You are offline, so this lesson could not be loaded.',
    )
  }
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'This lesson has no source file yet, so it cannot be edited here.'
        : `Could not load this lesson. Try again in a moment. Error ${response.status}.`,
    )
  }
  return response.text()
}

export interface SourceParts {
  frontmatter: string
  body: string
}

export function splitSource(source: string): SourceParts {
  const block = source.match(FRONTMATTER_RE)?.[0] ?? ''
  return { frontmatter: block, body: source.slice(block.length) }
}
