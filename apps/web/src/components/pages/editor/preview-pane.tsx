import { useDeferredValue, useMemo } from 'react'
import { MarkdownContent } from '@/components/content/markdown-content'
import { LessonTitle } from '@/components/pages/lesson/text/lesson-title'
import { Text } from '@/components/ui/text'
import { stripFrontmatter, stripTestQuestions } from '@/lib/content/frontmatter'
import { readFrontmatter } from '@/lib/editor/frontmatter-patch'
import { cn } from '@/lib/utils'

interface PreviewPaneProps {
  source: string
  title: string
  className?: string
}

// Mirrors the site's own render path (stripFrontmatter → stripTestQuestions → MarkdownContent) so the preview never shows what the live page wouldn't.
export function PreviewPane({ source, title, className }: PreviewPaneProps) {
  const deferred = useDeferredValue(source)

  const { body, questionsHidden } = useMemo(() => {
    const withoutFrontmatter = stripFrontmatter(deferred)
    const stripped = stripTestQuestions(withoutFrontmatter)
    // Only test lessons legitimately lose content here; the same truncation on any other type is the bug content-rules.ts flags, not something to reassure about.
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
            body, and they cannot appear here either. Your edits to them are still submitted, and they reach the site
            after the pull request is merged and the content sync runs.
          </Text>
        </div>
      )}
    </div>
  )
}
