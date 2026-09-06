import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Text } from '@/components/ui/text'
import { patchFrontmatter, readFrontmatter } from '@/lib/editor/frontmatter-patch'
import { cn } from '@/lib/utils'

interface FrontmatterFormProps {
  /** The whole file. Every field writes back a spliced copy of it. */
  source: string
  onSourceChange: (next: string) => void
  className?: string
}

// The four keys a contributor has any reason to change. `faq` stays in the file untouched — it is
// SEO metadata that never renders, and folded multi-line answers are exactly what the patcher
// exists to preserve.
const LESSON_TYPES = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'test', label: 'Test' },
  { value: 'coding_task', label: 'Coding task' },
  { value: 'review_task', label: 'Review task' },
]

const labelClass = 'text-muted-foreground'

export function FrontmatterForm({ source, onSourceChange, className }: FrontmatterFormProps) {
  const frontmatter = readFrontmatter(source)

  if (!frontmatter) {
    return (
      <div className={cn('border border-border p-4', className)}>
        <Text variant="main-14" className="text-muted-foreground">
          This file has no frontmatter block, so its title and type cannot be edited here. It needs one before it can be
          proposed.
        </Text>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4 border border-border p-4 sm:grid-cols-2', className)}>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <Text variant="caps-12" element="span" className={labelClass}>
          Title
        </Text>
        <Input
          value={frontmatter.title}
          onChange={(event) => onSourceChange(patchFrontmatter(source, { title: event.target.value }))}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <Text variant="caps-12" element="span" className={labelClass}>
          Type
        </Text>
        <Select
          value={frontmatter.type || undefined}
          onValueChange={(value) => onSourceChange(patchFrontmatter(source, { type: value }))}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Choose a type" />
          </SelectTrigger>
          <SelectContent>
            {LESSON_TYPES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex flex-col gap-1.5">
        <Text variant="caps-12" element="span" className={labelClass}>
          Order in module
        </Text>
        <Input
          type="number"
          inputMode="numeric"
          value={frontmatter.order ?? ''}
          // An empty box is a half-typed number, not a request to delete the key, so it is ignored
          // until it parses.
          onChange={(event) => {
            const parsed = Number(event.target.value)
            if (event.target.value !== '' && Number.isFinite(parsed)) {
              onSourceChange(patchFrontmatter(source, { order: parsed }))
            }
          }}
          className="h-10"
        />
      </label>

      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <div className="flex flex-col">
          <Text variant="caps-12" element="span" className={labelClass}>
            Hidden
          </Text>
          <Text variant="main-14" className="text-muted-foreground">
            Keeps the lesson out of the sidebar and the next-lesson chain.
          </Text>
        </div>
        <Switch
          checked={frontmatter.isHidden}
          onCheckedChange={(checked) => onSourceChange(patchFrontmatter(source, { isHidden: checked }))}
        />
      </div>

      {frontmatter.id !== null && (
        <div className="flex items-baseline gap-2 sm:col-span-2">
          <Text variant="caps-12" element="span" className={labelClass}>
            Lesson id
          </Text>
          {/* Read-only on purpose: an id is minted after merge and joins learners' saved answers to
              this lesson. Changing one silently reassigns the file to somebody else's row. */}
          <Text variant="main-14" className="text-muted-foreground">
            {frontmatter.id} — assigned automatically, not editable
          </Text>
        </div>
      )}
    </div>
  )
}
