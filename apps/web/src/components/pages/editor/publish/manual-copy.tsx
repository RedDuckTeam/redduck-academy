import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { focusRing, noticeClass } from '@/lib/editor/styles'
import { cn } from '@/lib/utils'

interface ManualCopyProps {
  content: string
  fileName: string
  url: string
}

export function ManualCopy({ content, fileName, url }: ManualCopyProps) {
  return (
    <div className={cn(noticeClass, 'p-3')}>
      <Text variant="caps-12" element="span" className="text-primary">
        Your browser wouldn’t let us use the clipboard
      </Text>
      <Text variant="main-14" className="text-muted-foreground">
        Nothing was copied. Select all of the text below, copy it yourself, then open GitHub.
      </Text>
      <textarea
        ref={(node) => node?.select()}
        readOnly
        value={content}
        aria-label={`${fileName}, the whole file, select and copy`}
        className={cn('h-40 w-full resize-y border border-border bg-transparent p-3 font-mono text-[13px]', focusRing)}
      />
      <div>
        <Button asChild variant="outline" size="sm" className={cn('gap-2', focusRing)}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open GitHub’s editor
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
    </div>
  )
}
