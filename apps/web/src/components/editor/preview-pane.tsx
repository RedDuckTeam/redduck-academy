import { useDeferredValue, useMemo } from 'react'
import { MarkdownContent } from '@/components/content/markdown-content'
import { LessonTitle } from '@/components/pages/lesson/text/lesson-title'
import { Text } from '@/components/ui/text'
import { stripFrontmatter, stripTestQuestions } from '@/lib/content/frontmatter'
import { readFrontmatter } from '@/lib/editor/frontmatter-patch'
import { cn } from '@/lib/utils'

interface PreviewPaneProps {
  /** The whole file, frontmatter included. */
  source: string
  title: string
  className?: string
}

/**
 * The site's own pipeline, not a second Markdown path: `stripFrontmatter` → `stripTestQuestions` →
 * `MarkdownContent`, exactly as `loadLessonContent` and the lesson route run it. Anything else
 * would show a preview that renders things the live page never does.
 */
export function PreviewPane({ source, title, className }: PreviewPaneProps) {
  // react-markdown plus the Shiki highlighter is far too heavy to run on every keystroke; the
  // preview lagging a beat behind the buffer is the right trade.
  const deferred = useDeferredValue(source)

  const { body, questionsHidden } = useMemo(() => {
    const withoutFrontmatter = stripFrontmatter(deferred)
    const stripped = stripTestQuestions(withoutFrontmatter)
    // Only a test lesson's questions are stored and rendered from the database. In any other type
    // the same truncation is the bug `content-rules.ts` reports, and the note below would be a
    // reassuring explanation of something that is actually wrong.
    const isTest = readFrontmatter(deferred)?.type === 'test'
    return { body: stripped, questionsHidden: isTest && stripped.length !== withoutFrontmatter.length }
  }, [deferred])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <LessonTitle title={title} />
      <MarkdownContent source={body} className="prose dark:prose-invert w-full max-w-none" />
      {questionsHidden && (
        <div className="border border-border p-4">
          <Text variant="main-14" className="text-muted-foreground">
            This lesson's questions are stored in the database and rendered from there, so they never appear in the page
            body — and they cannot appear here either. Your edits to them are still submitted, and they reach the site
            after the pull request is merged and the content sync runs.
          </Text>
        </div>
      )}
    </div>
  )
}
