import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { patchFrontmatter, readFrontmatter } from '@/lib/editor/frontmatter-patch'
import { cn } from '@/lib/utils'

interface FrontmatterFormProps {
  /** The whole file. The field writes back a spliced copy of it. */
  source: string
  onSourceChange: (next: string) => void
  className?: string
}

// Title is the only frontmatter a contributor can change here. `type`, `order` and `isHidden` decide
// where a lesson sits in the course and whether it appears at all — editorial calls that belong with
// whoever reviews the pull request, not with a drive-by correction. They stay in the file untouched,
// as does `faq`, which never renders and whose folded multi-line answers are exactly what the
// patcher exists to preserve.
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
      <Input
        value={frontmatter.title}
        onChange={(event) => onSourceChange(patchFrontmatter(source, { title: event.target.value }))}
      />
    </label>
  )
}
