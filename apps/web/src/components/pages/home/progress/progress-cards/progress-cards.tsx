import { useMemo } from 'react'
import { PageStatsCards } from '@/components/page-section/page-stats-cards'
import { useProgressCards } from '@/hooks/api/user/useProgressCards'
import { ordinalSuffix } from '@/lib/format-ordinal'
import { useCourses } from '@/hooks/api/courses/useCourses'
import { useSession } from '@/hooks/useSession'

// Rough, manually-maintained estimate of total completion time — there's no per-lesson
// duration in the catalog to sum, so bump this as the catalog grows. Rendered as "50+".
const ESTIMATED_HOURS = 100

export const ProgressCards = () => {
  const { session } = useSession()
  const { data, isLoading } = useProgressCards()
  const { data: coursesRes } = useCourses()

  const { totalCourses, moduleCount, totalLessons } = useMemo(() => {
    const courses = coursesRes?.data ?? []
    let modules = 0
    let lessons = 0
    for (const course of courses) {
      modules += course.modules.length
      for (const m of course.modules) lessons += m.lessons.length
    }
    return { totalCourses: courses.length, moduleCount: modules, totalLessons: lessons }
  }, [coursesRes])

  // Logged-out users, and signed-in users who haven't completed a lesson yet, get a
  // "what's on offer" teaser instead of zeroed-out personal stats. Guarding on `isLoading`
  // avoids flashing the teaser at returning users on a cold load.
  const showTeaser = !session?.user || (!isLoading && !data?.completedLessonsCount)

  if (showTeaser) {
    return (
      <PageStatsCards
        items={[
          {
            firstNum: String(totalCourses),
            text: 'COURSES',
            className: 'border-r max-xl:border-b border-border',
          },
          {
            firstNum: String(moduleCount),
            text: 'MODULES',
            className: 'xl:border-r max-xl:border-b border-border',
          },
          {
            firstNum: String(totalLessons),
            text: 'LESSONS',
            className: 'border-r border-border',
          },
          {
            firstNum: `${ESTIMATED_HOURS}+`,
            text: 'HOURS OF CONTENT',
          },
        ]}
      />
    )
  }

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
