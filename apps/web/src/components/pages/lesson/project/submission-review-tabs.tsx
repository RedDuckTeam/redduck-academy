import type { LatestProjectSubmission } from '@/types/lesson'
import { Text, textVariants } from '@/components/ui/text'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { StatusBar } from '../status-bar'

interface SubmissionReviewTabsProps {
  submissions: Array<LatestProjectSubmission & { repoUrl?: string | null; commitSha?: string | null }>
  /** Admin-only: render the submitted repository URL + reviewed commit per attempt. Never set in the learner view. */
  showRepository?: boolean
  /** Open this submission's tab by default (e.g. the one clicked in the admin list); falls back to the latest. */
  initialSubmissionId?: number
}

export function SubmissionReviewTabs({ submissions, showRepository = false, initialSubmissionId }: SubmissionReviewTabsProps) {
  if (submissions.length === 0) {
    return null
  }

  // Pending submissions have no tab, so default-tab math must use the filtered list, not the raw one.
  const filteredSubmissions = submissions.filter((s) => s.status !== 'pending')
  const requestedIndex =
    initialSubmissionId != null
      ? filteredSubmissions.findIndex((s) => s.id === initialSubmissionId)
      : -1
  const defaultIndex = requestedIndex >= 0 ? requestedIndex : filteredSubmissions.length - 1
  const defaultValue = `attempt-${defaultIndex}`

  return (
    <Tabs
      key={`${submissions.map((s) => s.id).join('-')}:${defaultValue}`}
      defaultValue={defaultValue}
      orientation="horizontal"
      className="flex flex-col gap-3 w-full "
    >
      <TabsList
        variant="line"
        className="flex w-full h-[100%] overflow-y-hidden items-center justify-start gap-1 overflow-x-auto"
      >
        {filteredSubmissions.map((submission, index) => {
          const passed = submission.status === 'completed' && !!submission.feedback && submission.feedback.lessonPassed
          return (
            <TabsTrigger
              key={submission.id}
              value={`attempt-${index}`}
              className={cn(
                'flex-none px-3 py-1 w-[50px] group-data-[variant=line]/tabs-list:data-[state=active]:bg-foreground group-data-horizontal/tabs:after:h-[3px] data-[state=active]:text-background',
                passed && 'after:bg-success',
              )}
            >
              #{index < 9 ? `0${index + 1}` : index + 1}
            </TabsTrigger>
          )
        })}
      </TabsList>
      {filteredSubmissions.map((submission, index) => (
        <TabsContent key={submission.id} value={`attempt-${index}`} className="mt-0 flex flex-col gap-4">
          {showRepository && submission.repoUrl && (
            <div className="flex flex-col gap-1">
              <Text variant="caps-14" className="text-secondary">
                Submitted repository
              </Text>
              <a
                href={submission.repoUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(textVariants({ variant: 'main-16' }), 'break-all text-primary underline hover:no-underline')}
              >
                {submission.repoUrl}
              </a>
              {submission.commitSha && (
                <Text variant="main-14" className="text-secondary">
                  Commit <span className="font-mono break-all">{submission.commitSha}</span>
                </Text>
              )}
            </div>
          )}
          {submission.status === 'completed' && submission.feedback && (
            <div className="flex flex-col gap-4">
              <StatusBar passed={submission.feedback.lessonPassed} />
              <Text variant="main-18" className="text-justify">
                {submission.feedback.summary}
              </Text>
              <div className="flex flex-col gap-8">
                {submission.feedback.criteria.map((c, i) => (
                  <div key={c.taskId} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Text variant="caps-20" className={cn(c.passed ? 'text-success' : 'text-primary')}>
                        {i < 9 ? `0${i + 1}` : i + 1}. {c.name}
                      </Text>
                    </div>
                    <Text variant="main-18" className="text-muted-foreground text-justify">
                      {c.comment}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}
          {submission.status === 'failed' && submission.errorMessage && (
            <Text variant="main-18" className="text-primary">
              {submission.errorMessage}
            </Text>
          )}
          {submission.status === 'failed' && !submission.errorMessage && (
            <Text variant="main-18" className="text-primary">
              Review failed.
            </Text>
          )}
          {submission.status === 'completed' && !submission.feedback && (
            <Text variant="main-18" className="">
              No feedback available.
            </Text>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
