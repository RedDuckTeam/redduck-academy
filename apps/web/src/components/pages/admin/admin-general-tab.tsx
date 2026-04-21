import { Text } from '@/components/ui/text'
import { BaseTooltip } from '@/components/ui/base-tooltip'
import { PageStatsCards } from '@/components/page-section/page-stats-cards'
import { useAdminStats } from '@/hooks/api/admin/useAdminStats'

function formatAverageLessons(value: number): string {
  if (value === 0) return '0'
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function AdminGeneralTab() {
  const { data: stats, isPending, isError, error } = useAdminStats()

  if (isPending) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-20" className="text-muted-foreground">
          LOADING…
        </Text>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-20" className="text-muted-foreground">
          {error?.message?.toUpperCase() ?? 'FAILED TO LOAD STATS'}
        </Text>
      </div>
    )
  }

  return (
    <PageStatsCards
      items={[
        {
          firstNum: String(stats.totalUsers),
          text: 'TOTAL USERS',
          className: 'border-r border-border',
        },
        {
          firstNum: String(stats.totalLessonCompletions),
          text: 'LESSON COMPLETIONS',
          className: 'border-r border-border',
        },
        {
          firstNum: formatAverageLessons(stats.averageLessonsPerUser),
          text: 'AVG LESSONS / USER',
          className: 'border-r border-border',
        },
        {
          firstNum: String(stats.activeLearners),
          text: (
            <>
              <Text variant="caps-20">ACTIVE LEARNERS</Text>
              <BaseTooltip triggerLabel="What counts as an active learner">
                Users with at least one completed lesson.
              </BaseTooltip>
            </>
          ),
          className: 'border-r border-border',
        },
        {
          firstNum: String(stats.totalCertificates),
          text: 'CERTIFICATES ISSUED',
        },
      ]}
    />
  )
}
