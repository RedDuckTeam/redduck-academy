import type { ReactNode } from 'react'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

interface Props {
  firstNum: string
  secondNum?: string
  text: ReactNode
  className?: string
}

export const ProgressCard = ({ firstNum, secondNum, text, className }: Props) => {
  return (
    <div
      className={cn(
        'sm:py-6 p-2.5 sm:px-[30px] max-xl:w-full xl:min-w-[260px] bg-background flex flex-col gap-1 sm:gap-2.5',
        className,
      )}
    >
      <div className="flex items-end gap-2.5">
        <Text variant="subtitle-45">{firstNum}</Text>
        {secondNum && (
          <Text variant="caps-20" className="leading-[40px]">
            {secondNum}
          </Text>
        )}
      </div>
      {typeof text === 'string' ? (
        <Text variant="caps-20">{text}</Text>
      ) : (
        <div className="flex min-w-0 items-center gap-1.5 flex-wrap">{text}</div>
      )}
    </div>
  )
}
