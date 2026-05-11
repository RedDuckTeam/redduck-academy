import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { formatValue } from '../utils'

interface ValueBoxProps {
  name?: string
  value: unknown
  highlight?: 'pass' | 'fail'
}

export function ValueBox({ name, value, highlight }: ValueBoxProps) {
  return (
    <div
      className={cn(
        'px-3 py-2 bg-muted flex flex-col',
        highlight === 'pass' && 'bg-success/10 text-success',
        highlight === 'fail' && 'bg-primary/10 text-primary',
      )}
    >
      {name && (
        <Text variant="caps-12" className="text-muted-foreground normal-case mb-1">
          {name} =
        </Text>
      )}
      <pre className="text-[14px] leading-[18px] whitespace-pre-wrap break-all">{formatValue(value)}</pre>
    </div>
  )
}
