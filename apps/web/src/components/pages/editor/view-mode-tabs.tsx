import { Columns2, Eye, PenLine } from 'lucide-react'
import { focusRing } from '@/lib/editor/styles'
import { cn } from '@/lib/utils'

export type ViewMode = 'write' | 'split' | 'preview'

const MODES: Array<{ mode: ViewMode; label: string; icon: typeof PenLine }> = [
  { mode: 'write', label: 'Write', icon: PenLine },
  { mode: 'split', label: 'Split', icon: Columns2 },
  { mode: 'preview', label: 'Preview', icon: Eye },
]

interface ViewModeTabsProps {
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
  canSplit: boolean
}

export function ViewModeTabs({ mode, onModeChange, canSplit }: ViewModeTabsProps) {
  return (
    <div role="group" aria-label="Panes" className="flex w-full border border-border sm:w-auto">
      {MODES.filter(({ mode: value }) => value !== 'split' || canSplit).map(({ mode: value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onModeChange(value)}
          className={cn(
            'inline-flex flex-1 cursor-pointer items-center justify-center gap-2 px-3 py-2 text-[14px] leading-none transition-colors sm:flex-none sm:justify-start',
            focusRing,
            mode === value ? 'bg-foreground text-background' : 'hover:bg-muted',
          )}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </button>
      ))}
    </div>
  )
}
