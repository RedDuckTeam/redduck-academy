import { getLesson } from '@/lib/api/courses'
import { lessonMarkdownDoc, lexicalToMarkdown } from '@/lib/lexical-to-markdown'
import { loadLessonContent } from '@/lib/content/lesson-body'

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
