import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageStatsCards } from '@/components/page-section/page-stats-cards'
import { useProgressCards } from '@/hooks/api/user/useProgressCards'
import { ordinalSuffix } from '@/lib/format-ordinal'
import { getCourses } from '@/lib/api/courses'
import { queryKeys } from '@/lib/query-keys'

export const ProgressCards = () => {
  const { data } = useProgressCards()
  const { data: coursesRes } = useQuery({
    queryKey: queryKeys.courses.all(),
    queryFn: getCourses,
    staleTime: 30 * 60 * 1000,
  })

  const { totalCourses, totalLessons } = useMemo(() => {
    const courses = coursesRes?.data ?? []
    let lessons = 0
    for (const course of courses) {
      for (const m of course.modules) lessons += m.lessons.length
    }
    return { totalCourses: courses.length, totalLessons: lessons }
  }, [coursesRes])

  return (
    <PageStatsCards
      items={[
        {
          firstNum: String(data?.completedLessonsCount ?? 0),
          secondNum: `/${totalLessons}`,
          text: 'lessons completed',
          className: 'border-r max-xl:border-b border-border',
        },
        {
          firstNum: String(data?.completedCoursesCount ?? 0),
          secondNum: `/${data?.totalCoursesCount ?? totalCourses}`,
          text: 'courses completed',
          className: 'xl:border-r max-xl:border-b border-border',
        },
        {
          firstNum: String(data?.currentStreak ?? 0),
          text: 'day streak',
          className: 'border-r border-border',
        },
        {
          firstNum: data?.placeInRanking ? data.placeInRanking.toString() : '-',
          secondNum: data?.placeInRanking ? ordinalSuffix(data.placeInRanking) : undefined,
          text: 'PLACE IN RANKING',
        },
      ]}
    />
  )
}
