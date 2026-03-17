import { DuckIcon } from './icons/duck'
import { Text } from './text'

interface DucksBadgeProps {
  myDucks: number | null
  ducks: number
}

export const DucksBadge = ({ myDucks, ducks }: DucksBadgeProps) => {
  return (
    <div className="flex items-center justify-center gap-2.5 py-3 px-[30px] bg-primary">
      <DuckIcon className="w-[31px]" />
      <Text variant="caps-14">{myDucks !== null ? `${myDucks} / ${ducks}` : `${ducks}`} ducks</Text>
    </div>
  )
}
