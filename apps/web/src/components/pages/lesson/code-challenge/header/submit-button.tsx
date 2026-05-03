import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

interface SubmitButtonProps {
  onSubmit: () => void
  isPending: boolean
  disabled: boolean
}

export function SubmitButton({ onSubmit, isPending, disabled }: SubmitButtonProps) {
  return (
    <Button
      size="sm"
      variant="default"
      onClick={onSubmit}
      className="border border-primary"
      disabled={disabled}
    >
      <Text variant="caps-14" className="flex items-center gap-1">
        {isPending ? 'Pending' : 'Submit'}
      </Text>
    </Button>
  )
}
