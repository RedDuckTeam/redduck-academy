import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { readFrontmatter, setTitle } from '@/lib/editor/lesson-frontmatter'
import { cn } from '@/lib/utils'

interface FrontmatterFormProps {
  source: string
  onSourceChange: (next: string) => void
  className?: string
}

export function FrontmatterForm({ source, onSourceChange, className }: FrontmatterFormProps) {
  const frontmatter = readFrontmatter(source)

  if (!frontmatter) {
    return (
      <div className={cn('border border-border p-4', className)}>
        <Text variant="main-14" className="text-muted-foreground">
          This file has no frontmatter, the settings block at the top that holds the title, so there is no title to edit
          here. A lesson without one does not pass the checks on GitHub.
        </Text>
      </div>
    )
  }

  return (
    <label className={cn('flex flex-col gap-1.5 border border-border p-4', className)}>
      <Text variant="caps-12" element="span" className="text-muted-foreground">
        Title
      </Text>
      <Input value={frontmatter.title} onChange={(event) => onSourceChange(setTitle(source, event.target.value))} />
    </label>
  )
}
