import type { LatestProjectSubmission } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

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
      className="flex flex-col gap-3 w-full max-w-[600px]"
    >
      <TabsList
        variant="line"
        className="flex w-full !h-auto flex-col items-stretch justify-start gap-4 sm:flex-row sm:flex-wrap sm:items-center"
      >
        {filteredSubmissions.map((submission, index) => (
          <TabsTrigger key={submission.id} value={`attempt-${index}`}>
            Attempt {index + 1}
          </TabsTrigger>
        ))}
      </TabsList>
      {filteredSubmissions.map((submission, index) => (
        <TabsContent key={submission.id} value={`attempt-${index}`} className="mt-0">
          {submission.status === 'completed' && submission.feedback && (
            <div className="flex flex-col gap-4">
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
