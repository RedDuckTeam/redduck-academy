import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

interface RunButtonProps {
  onRun: () => void
  isRunning: boolean
  disabled: boolean
}

export function RunButton({ onRun, isRunning, disabled }: RunButtonProps) {
  return (
    <Button size="sm" variant="outline" onClick={onRun} disabled={disabled || isRunning}>
      <Text variant="caps-14" className="flex items-center gap-1">
        <Play className="h-3 w-3" />
        {isRunning ? 'Running' : 'Run'}
      </Text>
    </Button>
  )
}
