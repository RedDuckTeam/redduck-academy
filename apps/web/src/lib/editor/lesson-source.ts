import { contentAssetPath } from '@/lib/content/paths'
import { FRONTMATTER_RE } from '@/lib/content/frontmatter'

export interface LessonSource {
  /** The file exactly as served, frontmatter included. The editor buffer starts as this string. */
  text: string
  /** SHA-256 of `text`. The server re-hashes the file at `main` HEAD and 409s when they differ. */
  baseHash: string
}

/**
 * Hex SHA-256 over UTF-8 bytes, matching the server's `createHash('sha256').update(value, 'utf8')`.
 * `crypto.subtle` needs a secure context, which every origin this route runs on is (localhost counts).
 */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Reads the lesson from the same `/_content/**.md` static asset the lesson page loads, rather than
 * a backend endpoint: a read endpoint would be an unauthenticated GitHub proxy spending the App's
 * hourly quota on every editor page-open. Staleness is caught at submit instead, via `baseHash`.
 */
export async function loadLessonSource(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
): Promise<LessonSource> {
  // Revalidate rather than accept a CDN copy from before the last deploy — a stale buffer only
  // surfaces later as a 409 the contributor has no way to act on.
  const response = await fetch(contentAssetPath(courseSlug, moduleSlug, lessonSlug), { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'This lesson has no source file yet, so it cannot be edited here.'
        : 'Could not load this lesson. Check your connection and try again.',
    )
  }
  const text = await response.text()
  return { text, baseHash: await sha256Hex(text) }
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
