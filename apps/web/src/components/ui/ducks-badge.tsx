import { DuckIcon } from './icons/duck'
import { Text } from './text'
import { cn } from '@/lib/utils'

interface DucksBadgeProps {
  myDucks: number | null
  ducks: number
  className?: string
  /** When set, duck + label follow theme foreground (e.g. light/dark). Default keeps fixed black styling. */
  themeAware?: boolean
}

export const DucksBadge = ({ myDucks, ducks, className, themeAware }: DucksBadgeProps) => {
  return (
    <div className={cn('flex items-center justify-center gap-2.5 py-3 px-[30px] bg-primary', className)}>
      <DuckIcon
        className={cn('w-[31px]', themeAware && '[&_path]:fill-foreground')}
      />
      <Text variant="caps-14" className={themeAware ? 'text-foreground' : 'text-[#000000]'}>
        {myDucks !== null ? `${myDucks} / ${ducks}` : `${ducks}`} ducks
      </Text>
    </div>
  )
}
