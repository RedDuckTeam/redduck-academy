import { DuckIcon } from './icons/duck'
import { Text } from './text'
import { cn } from '@/lib/utils'

interface DucksBadgeProps {
  myDucks: number | null
  ducks: number
  className?: string
}

export const DucksBadge = ({ myDucks, ducks, className }: DucksBadgeProps) => {
  return (
    <div className={cn('flex items-center justify-center gap-2.5 py-3 px-[30px] bg-primary', className)}>
      <DuckIcon className="w-[31px]" />
      <Text variant="caps-14">{myDucks !== null ? `${myDucks} / ${ducks}` : `${ducks}`} ducks</Text>
    </div>
  )
}
