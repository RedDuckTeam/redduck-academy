import { Text } from '@/components/ui/text'
import { BaseTooltip } from '@/components/ui/base-tooltip'
import { PageStatsCards } from '@/components/page-section/page-stats-cards'
import { useAdminAiCosts } from '@/hooks/api/admin/useAdminAiCosts'

/** Small amounts (sub-$1) need more precision than a normal currency display. */
function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return '$0'
  const decimals = value !== 0 && Math.abs(value) < 1 ? 4 : 2
  return `$${value.toFixed(decimals)}`
}

function StateBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-border p-10 text-center">
      <Text variant="caps-20" className="text-muted-foreground">
        {children}
      </Text>
    </div>
  )
}

export function AdminCostsTab() {
  const { data, isPending, isError, error } = useAdminAiCosts()

  if (isPending) return <StateBox>LOADING…</StateBox>
  if (isError || !data) return <StateBox>{error?.message?.toUpperCase() ?? 'FAILED TO LOAD COSTS'}</StateBox>

  const { summary, byModel, courses, topUsers } = data

  return (
    <div className="flex flex-col gap-8">
      <PageStatsCards
        items={[
          { firstNum: formatUsd(summary.today), text: 'SPEND TODAY', className: 'border-r border-border' },
          { firstNum: formatUsd(summary.last7d), text: 'LAST 7 DAYS', className: 'border-r border-border' },
          { firstNum: formatUsd(summary.last30d), text: 'LAST 30 DAYS', className: 'border-r border-border' },
          {
            firstNum: formatUsd(summary.allTime),
            text: (
              <>
                <Text variant="caps-20">ALL TIME</Text>
                <BaseTooltip triggerLabel="About these numbers">
                  Estimated USD from token counts (pricing {data.pricingVersion}) — not the exact OpenAI
                  invoice. Tracking is forward-only from when usage capture shipped.
                </BaseTooltip>
              </>
            ),
            className: 'border-r border-border',
          },
          { firstNum: String(summary.totalCalls), text: 'TOTAL AI CALLS' },
        ]}
      />

      <section className="flex flex-col gap-3">
        <Text variant="subtitle-32" element="h2">
          By model
        </Text>
        {byModel.length === 0 ? (
          <StateBox>NO USAGE YET</StateBox>
        ) : (
          <div className="border border-border">
            {byModel.map((m) => (
              <div
                key={m.model}
                className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0"
              >
                <Text variant="main-16">{m.model}</Text>
                <div className="flex gap-6">
                  <Text variant="main-16" className="text-muted-foreground">
                    {m.calls.toLocaleString()} calls
                  </Text>
                  <Text variant="main-16" className="text-muted-foreground">
                    {m.totalTokens.toLocaleString()} tok
                  </Text>
                  <Text variant="main-16">{formatUsd(m.cost)}</Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="subtitle-32" element="h2">
          Expensive lessons
        </Text>
        {courses.length === 0 ? (
          <StateBox>NO USAGE YET</StateBox>
        ) : (
          <div className="flex flex-col gap-4">
            {courses.map((course) => (
              <div key={course.courseId ?? course.courseTitle} className="border border-border">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <Text variant="main-16" className="font-medium">
                    {course.courseTitle}
                  </Text>
                  <Text variant="main-16" className="font-medium">
                    {formatUsd(course.cost)}
                  </Text>
                </div>
                {course.lessons.map((l) => (
                  <div
                    key={l.lessonId}
                    className="flex items-center justify-between border-b border-border px-4 py-2.5 last:border-b-0"
                  >
                    <div className="flex flex-col">
                      <Text variant="main-16">{l.title}</Text>
                      <Text variant="caps-20" className="text-muted-foreground">
                        {l.type} · {l.calls.toLocaleString()} calls
                      </Text>
                    </div>
                    <Text variant="main-16">{formatUsd(l.cost)}</Text>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="subtitle-32" element="h2">
          Top users by spend
        </Text>
        {topUsers.length === 0 ? (
          <StateBox>NO USAGE YET</StateBox>
        ) : (
          <div className="overflow-x-auto border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3">
                    <Text variant="caps-20" className="text-muted-foreground">
                      USER
                    </Text>
                  </th>
                  <th className="px-4 py-3">
                    <Text variant="caps-20" className="text-muted-foreground">
                      CALLS
                    </Text>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <Text variant="caps-20" className="text-muted-foreground">
                      SPEND
                    </Text>
                  </th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((u) => (
                  <tr key={u.userId} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2.5">
                      <Text variant="main-16">{u.userName || u.username || 'Unknown'}</Text>
                      {u.userEmail && (
                        <Text variant="caps-20" className="text-muted-foreground">
                          {u.userEmail}
                        </Text>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Text variant="main-16">{u.calls.toLocaleString()}</Text>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Text variant="main-16">{formatUsd(u.cost)}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
