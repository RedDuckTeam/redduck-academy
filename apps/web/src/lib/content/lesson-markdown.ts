import { getLesson } from '@/lib/api/courses'
import { lessonMarkdownDoc, lexicalToMarkdown } from '@/lib/lexical-to-markdown'
import { loadLessonBody } from '@/lib/content/lesson-body'

/**
 * Fetch a lesson and render it as a self-attributing Markdown document (title, Source
 * URL, body, FAQ) — used by the `Accept: text/markdown` endpoint and `/llms-full.txt`.
 * The body comes from the open-source `content/` assets, falling back to the DB Lexical
 * for any lesson not yet dumped to a file.
 */
export async function buildLessonMarkdownDoc(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  sourceUrl: string,
): Promise<string> {
  const { data } = await getLesson(courseSlug, lessonSlug)
  const body = (await loadLessonBody(courseSlug, moduleSlug, lessonSlug)) ?? lexicalToMarkdown(data.content)
  return lessonMarkdownDoc(data.title, sourceUrl, body, data.faq)
}
