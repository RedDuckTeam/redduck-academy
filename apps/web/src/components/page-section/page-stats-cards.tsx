import { ProgressCard } from '@/components/pages/home/progress/progress-cards/progress-card'
import { cn } from '@/lib/utils'

export type PageStatsCardItem = {
  firstNum: string
  secondNum?: string
  text: string
  className?: string
}

type PageStatsCardsProps = {
  items: PageStatsCardItem[]
  className?: string
}

export const PageStatsCards = ({ items, className }: PageStatsCardsProps) => {
  return (
    <div
      className={cn(
        'xl:flex max-xl:grid max-xl:w-full grid-cols-2 border border-border shrink-0',
        className,
      )}
    >
      {items.map((item, index) => (
        <ProgressCard
          key={`${item.text}-${index}`}
          firstNum={item.firstNum}
          secondNum={item.secondNum}
          text={item.text}
          className={item.className}
        />
      ))}
    </div>
  )
}
