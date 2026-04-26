import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

interface StatusBarProps {
  passed?: boolean
  rateLimitMessage?: string
  className?: string
}

export function StatusBar({ passed, rateLimitMessage, className }: StatusBarProps) {
  if (rateLimitMessage) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2 border-t border-border bg-yellow-500/10',
          className,
        )}
      >
        <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
        <Text variant="main-14" className="text-yellow-500">
          {rateLimitMessage}
        </Text>
      </div>
    )
  }

  if (passed === undefined) return null

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 border-t transition-colors border-border',
        passed ? 'bg-success/10' : 'bg-primary/10',
        className,
      )}
    >
      {passed ? (
        <CheckCircle className="h-4 w-4 text-success shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-primary shrink-0" />
      )}
      <Text variant="main-14" className={passed ? 'text-success' : 'text-primary'}>
        {passed ? 'Passed' : 'Not passed'}
      </Text>
    </div>
  )
}
