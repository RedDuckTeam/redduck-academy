import type { LatestProjectSubmission } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { StatusBar } from '../status-bar'

interface SubmissionReviewTabsProps {
  submissions: LatestProjectSubmission[]
}

export function SubmissionReviewTabs({ submissions }: SubmissionReviewTabsProps) {
  if (submissions.length === 0) {
    return null
  }

  const filteredSubmissions = submissions.filter((s) => s.status !== 'pending')
  const defaultValue = `attempt-${submissions.length - 1}`

  return (
    <Tabs
      key={submissions.map((s) => s.id).join('-')}
      defaultValue={defaultValue}
      orientation="horizontal"
      className="flex flex-col gap-3 w-full "
    >
      <TabsList
        variant="line"
        className="grid w-full !h-auto grid-cols-2 items-center gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {filteredSubmissions.map((submission, index) => {
          const passed =
            submission.status === 'completed' &&
            !!submission.feedback &&
            submission.feedback.criteria.every((c) => c.passed)
          return (
            <TabsTrigger key={submission.id} value={`attempt-${index}`} className={cn(passed && 'after:bg-success')}>
              Attempt {index + 1}
            </TabsTrigger>
          )
        })}
      </TabsList>
      {filteredSubmissions.map((submission, index) => (
        <TabsContent key={submission.id} value={`attempt-${index}`} className="mt-0 flex flex-col gap-4">
          {submission.status === 'completed' && submission.feedback && (
            <div className="flex flex-col gap-4">
              <StatusBar passed={submission.feedback.criteria.every((c) => c.passed)} />
              <Text variant="main-18" className="text-justify">
                {submission.feedback.summary}
              </Text>
              <div className="flex flex-col gap-8">
                {submission.feedback.criteria.map((c, i) => (
                  <div key={c.taskId} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Text variant="main-18" className={cn(c.passed ? 'text-success' : 'text-primary')}>
                        {i + 1}. {c.name}
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
