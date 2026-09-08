import { useDeferredValue, useMemo } from 'react'
import { MarkdownContent } from '@/components/content/markdown-content'
import { lessonProseClass } from '@/components/content/rich-content-styles'
import { LessonTitle } from '@/components/pages/lesson/text/lesson-title'
import { lessonBodyFromSource } from '@/lib/content/lesson-body'
import { readFrontmatter } from '@/lib/editor/lesson-frontmatter'
import { cn } from '@/lib/utils'

interface PreviewPaneProps {
  source: string
  lessonSlug: string
  className?: string
}

export function PreviewPane({ source, lessonSlug, className }: PreviewPaneProps) {
  const deferred = useDeferredValue(source)

  const { title, body } = useMemo(() => {
    const frontmatter = readFrontmatter(deferred)
    return { title: frontmatter?.title ?? lessonSlug, body: lessonBodyFromSource(deferred) }
  }, [deferred, lessonSlug])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <LessonTitle title={title} />
      <MarkdownContent source={body} className={lessonProseClass} />
    </div>
  )
}
