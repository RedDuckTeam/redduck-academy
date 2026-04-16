import { useProgressCards } from '@/hooks/api/user/useProgressCards'
import { ProgressCard } from './progress-card'

export const ProgressCards = () => {
  const { data } = useProgressCards()

  return (
    <div className="xl:flex max-xl:grid max-xl:w-full grid-cols-2 border border-border">
      <ProgressCard
        firstNum={String(data?.completedLessonsCount ?? 0)}
        text="lessons completed"
        className="xl:border-r max-xl:border-b border-border"
      />
      <ProgressCard
        firstNum={String(data?.completedCoursesCount ?? 0)}
        secondNum={`/${data?.totalCoursesCount ?? 0}`}
        text="courses completed"
        className="border-r border-border"
      />
      <ProgressCard firstNum={String(data?.currentStreak ?? 0)} text="day streak" />
    </div>
  )
}
