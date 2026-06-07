import { cn } from '@/lib/utils'
import { Text } from '../../ui/text'
import { LongArrowRight } from '../../ui/icons/long-arrow-right'

interface SignUpOptionButtonProps {
  number: string
  label: string
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export const SignUpOptionButton = ({ number, label, className, disabled, onClick }: SignUpOptionButtonProps) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'flex w-full max-w-[850px] min-h-[100px] items-center justify-between rounded-[80px] bg-foreground px-10 py-[18px] md:min-h-0 md:px-[70px]',
      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      className,
    )}
  >
    <Text variant="title-80" className="min-h-0 text-background max-md:text-[32px] max-md:leading-none">
      {number}
    </Text>
    <Text variant="subtitle-45" className="text-background max-md:text-[20px] max-md:leading-normal max-md:min-h-0">
      {label}
    </Text>
    <LongArrowRight className="[&_path]:fill-background" />
  </button>
)
