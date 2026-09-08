import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { readFrontmatter, setTitle } from '@/lib/editor/lesson-frontmatter'
import { cn } from '@/lib/utils'

interface FrontmatterFormProps {
  source: string
  onSourceChange: (next: string) => void
  className?: string
}

// Title is the only field exposed here — type/order/isHidden/faq are editorial calls for the PR reviewer, not a drive-by edit, and stay untouched.
export function FrontmatterForm({ source, onSourceChange, className }: FrontmatterFormProps) {
  const frontmatter = readFrontmatter(source)

  if (!frontmatter) {
    return (
      <div className={cn('border border-border p-4', className)}>
        <Text variant="main-14" className="text-muted-foreground">
          This file has no frontmatter block, so its title cannot be edited here. It needs one before it can be
          proposed.
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
