import { AlertTriangle } from 'lucide-react'
import { Text } from '@/components/ui/text'
import { focusRing, noticeClass } from '@/lib/editor/styles'
import type { ContentRuleViolation } from '@/lib/editor/content-rules'
import { cn } from '@/lib/utils'

export const VIOLATIONS_ID = 'lesson-editor-violations'

interface ViolationListProps {
  violations: ContentRuleViolation[]
  onGoToLine: (line: number) => void
}

// role="status", not "alert": this updates on every keystroke, and an assertive interruption
// mid-sentence would be worse than the typo it reports.
export function ViolationList({ violations, onGoToLine }: ViolationListProps) {
  return (
    <div id={VIOLATIONS_ID} className={noticeClass} role="status">
      <Text variant="caps-12" element="span" className="flex items-center gap-2 text-primary">
        <AlertTriangle className="size-4" />
        {violations.length === 1 ? 'One thing to fix before publishing' : `${violations.length} things to fix`}
      </Text>
      <ul className="flex flex-col gap-2">
        {violations.map((violation) => (
          <li key={violation.message} className="flex flex-wrap items-baseline gap-2">
            <button
              type="button"
              onClick={() => onGoToLine(violation.line)}
              className={cn('cursor-pointer font-mono text-[13px] text-primary underline', focusRing)}
            >
              Go to line {violation.line}
            </button>
            <Text variant="main-14" element="span" className="flex-1">
              {violation.message}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  )
}
