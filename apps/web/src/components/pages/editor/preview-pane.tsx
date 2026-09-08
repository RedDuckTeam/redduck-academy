import { useDeferredValue, useMemo } from 'react'
import { MarkdownContent } from '@/components/content/markdown-content'
import { lessonProseClass } from '@/components/content/rich-content-styles'
import { LessonTitle } from '@/components/pages/lesson/text/lesson-title'
import { Text } from '@/components/ui/text'
import { TEST_QUESTION_MARKER_RE } from '@/lib/content/frontmatter'
import { lessonBodyFromSource } from '@/lib/content/lesson-body'
import { readFrontmatter } from '@/lib/editor/lesson-frontmatter'
import { cn } from '@/lib/utils'

interface PreviewPaneProps {
  source: string
  lessonSlug: string
  className?: string
}

// Renders through the site's own `lessonBodyFromSource` so the preview never shows what the live page wouldn't.
export function PreviewPane({ source, lessonSlug, className }: PreviewPaneProps) {
  const deferred = useDeferredValue(source)

  // Title and body both come off the deferred source — deriving the title from the live one
  // instead paints the new heading over the body React has not caught up with yet.
  const { title, body, questionsHidden } = useMemo(() => {
    const frontmatter = readFrontmatter(deferred)
    // Only test lessons legitimately lose content here; the same truncation on any other type is the bug content-rules.ts flags, not something to reassure about.
    const isTest = frontmatter?.type === 'test'
    return {
      title: frontmatter?.title ?? lessonSlug,
      body: lessonBodyFromSource(deferred),
      questionsHidden: isTest && TEST_QUESTION_MARKER_RE.test(deferred),
    }
  }, [deferred, lessonSlug])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <LessonTitle title={title} />
      <MarkdownContent source={body} className={lessonProseClass} />
      {questionsHidden && (
        <div className="border border-border p-4">
          <Text variant="main-14" className="text-muted-foreground">
            This lesson's questions are stored in the database and rendered from there, so they never appear in the page
            body, and they cannot appear here either. Your edits to them are still submitted, and they reach the site
            after the pull request is merged and the content sync runs.
          </Text>
        </div>
      )}
    </div>
  )
}
