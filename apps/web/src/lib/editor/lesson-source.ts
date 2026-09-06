import { contentAssetPath } from '@/lib/content/paths'
import { FRONTMATTER_RE } from '@/lib/content/frontmatter'

/**
 * Reads the lesson from the same `/_content/**.md` static asset the lesson page loads. These assets
 * are built from `content/`, so they trail `main` by a deploy; GitHub's editor shows the current
 * file, and the contributor pastes over that.
 */
export async function loadLessonSource(courseSlug: string, moduleSlug: string, lessonSlug: string): Promise<string> {
  // Revalidate rather than accept a CDN copy from before the last deploy — every extra hour of
  // staleness here is another chance of editing against a file that has already moved on.
  let response: Response
  try {
    response = await fetch(contentAssetPath(courseSlug, moduleSlug, lessonSlug), { cache: 'no-cache' })
  } catch {
    throw new Error(
      navigator.onLine
        ? 'Could not reach the server to load this lesson. Try again in a moment.'
        : 'You appear to be offline, so this lesson could not be loaded.',
    )
  }
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'This lesson has no source file yet, so it cannot be edited here.'
        : `Could not load this lesson — the server answered ${response.status}.`,
    )
  }
  return response.text()
}

export interface SourceParts {
  /** The `---` block including its trailing newline, kept verbatim. Empty when the file has none. */
  frontmatter: string
  body: string
}

/**
 * Splits the file so the form owns the frontmatter and CodeMirror owns the prose. Both halves are
 * only ever sliced and re-concatenated — the submitted file stays byte-identical outside the spans
 * the contributor actually edited.
 */
export function splitSource(source: string): SourceParts {
  const block = source.match(FRONTMATTER_RE)?.[0] ?? ''
  return { frontmatter: block, body: source.slice(block.length) }
}
