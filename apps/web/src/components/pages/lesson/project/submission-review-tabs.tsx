import type { LatestProjectSubmission } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SubmissionReviewTabsProps {
  submissions: LatestProjectSubmission[]
}

export function SubmissionReviewTabs({ submissions }: SubmissionReviewTabsProps) {
  if (submissions.length === 0) {
    return null
  }

  const defaultValue = `attempt-${submissions.length - 1}`

  return (
    <Tabs
      key={submissions.map((s) => s.id).join('-')}
      defaultValue={defaultValue}
      orientation="horizontal"
      className="flex flex-col gap-3"
    >
      <TabsList variant="line" className="w-full max-w-[420px] flex-wrap justify-start h-auto min-h-8">
        {submissions.map((submission, index) => (
          <TabsTrigger key={submission.id} value={`attempt-${index}`}>
            Attempt {index + 1}
          </TabsTrigger>
        ))}
      </TabsList>
      {submissions.map((submission, index) => (
        <TabsContent key={submission.id} value={`attempt-${index}`} className="mt-0">
          {submission.status === 'pending' && (
            <Text variant="main-18" className="text-muted-foreground">
              Review in progress…
            </Text>
          )}
          {submission.status === 'completed' && submission.feedback && (
            <div className="flex flex-col gap-2">
              <Text variant="main-18">{submission.feedback.summary}</Text>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {submission.feedback.criteria.map((c) => (
                  <li key={c.taskId}>
                    {c.name}: {c.points}/{c.maxPoints} — {c.passed ? 'Passed' : 'Not passed'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {submission.status === 'failed' && submission.errorMessage && (
            <Text variant="main-18" className="text-destructive">
              {submission.errorMessage}
            </Text>
          )}
          {submission.status === 'failed' && !submission.errorMessage && (
            <Text variant="main-18" className="text-destructive">
              Review failed.
            </Text>
          )}
          {submission.status === 'completed' && !submission.feedback && (
            <Text variant="main-18" className="text-muted-foreground">
              No feedback available.
            </Text>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
