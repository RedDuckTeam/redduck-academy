import { PageStatsCards } from '@/components/page-section/page-stats-cards'
import { useProgressCards } from '@/hooks/api/user/useProgressCards'

export const ProgressCards = () => {
  const { data } = useProgressCards()

  return (
    <PageStatsCards
      items={[
        {
          firstNum: String(data?.completedLessonsCount ?? 0),
          text: 'lessons completed',
          className: 'xl:border-r max-xl:border-b border-border',
        },
        {
          firstNum: String(data?.completedCoursesCount ?? 0),
          secondNum: `/${data?.totalCoursesCount ?? 0}`,
          text: 'courses completed',
          className: 'border-r border-border',
        },
        {
          firstNum: String(data?.currentStreak ?? 0),
          text: 'day streak',
        },
      ]}
    />
  )
}
