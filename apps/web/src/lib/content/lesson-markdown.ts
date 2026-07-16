import { getLesson } from '@/lib/api/courses'
import { lessonMarkdownDoc, lexicalToMarkdown } from '@/lib/lexical-to-markdown'
import { loadLessonContent } from '@/lib/content/lesson-body'

/**
 * Fetch a lesson and render it as a self-attributing Markdown document (title, Source
 * URL, body, FAQ) — used by the `Accept: text/markdown` endpoint and `/llms-full.txt`.
 * Body + faq come from the open-source `content/` assets (one `.md` fetch), falling back
 * to the DB Lexical / lesson row for any lesson not yet dumped to a file.
 */
export async function buildLessonMarkdownDoc(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  sourceUrl: string,
): Promise<string> {
  const { data } = await getLesson(courseSlug, lessonSlug)
  const content = await loadLessonContent(courseSlug, moduleSlug, lessonSlug)
  const body = content?.body ?? lexicalToMarkdown(data.content)
  return lessonMarkdownDoc(data.title, sourceUrl, body, content?.faq ?? data.faq ?? null)
}
