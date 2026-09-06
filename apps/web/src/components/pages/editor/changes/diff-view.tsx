import type { DiffHunk } from '@/lib/editor/line-diff'
import { cn } from '@/lib/utils'

interface DiffViewProps {
  hunks: DiffHunk[] | null
  fallback: string
  label: string
  className?: string
}

const monoBlockClass = 'overflow-auto border border-border p-3 font-mono text-[13px] leading-[1.5]'

/** Marked with −/+ as well as colour — a colour-only diff is unreadable to the ~1 in 12 men who are red-green colour-blind. */
export function DiffView({ hunks, fallback, label, className }: DiffViewProps) {
  if (hunks === null) {
    return (
      <pre className={cn(monoBlockClass, 'whitespace-pre-wrap', className)} tabIndex={0} aria-label={label}>
        {fallback}
      </pre>
    )
  }

  return (
    <div className={cn(monoBlockClass, className)} tabIndex={0} role="group" aria-label={label}>
      {hunks.map((hunk, index) => (
        <div key={index} className={index > 0 ? 'mt-3 border-t border-border pt-3' : undefined}>
          {hunk.lines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className={cn(
                'flex gap-2 whitespace-pre-wrap',
                line.kind === 'removed' && 'bg-primary/10 text-primary',
                line.kind === 'added' && 'bg-success/15 text-success',
              )}
            >
              <span aria-hidden className="w-3 shrink-0 select-none opacity-70">
                {line.kind === 'removed' ? '−' : line.kind === 'added' ? '+' : ' '}
              </span>
              <span className="min-w-0 flex-1">{line.text || ' '}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
