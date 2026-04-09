import type { CodingTaskSubmission, LessonForUser } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle } from 'lucide-react'

interface CodingTaskResultProps {
  lesson: LessonForUser
}

function isCodingTaskSubmissions(
  submissions: LessonForUser['submissions'],
): submissions is CodingTaskSubmission[] {
  return (
    Array.isArray(submissions) &&
    (submissions.length === 0 || typeof (submissions[0] as CodingTaskSubmission).passed === 'boolean')
  )
}

export function CodingTaskResult({ lesson }: CodingTaskResultProps) {
  const submissions = isCodingTaskSubmissions(lesson.submissions) ? lesson.submissions : []
  const latest = submissions.at(-1)
  const attemptsLeft = lesson.attemptsLeft ?? 50

  return (
    <div className="flex flex-col gap-4 p-5">
      {latest ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {latest.passed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <Text variant="main-14" className={cn('font-semibold', latest.passed ? 'text-green-500' : 'text-red-500')}>
              {latest.passed ? 'Passed' : 'Not passed'}
            </Text>
          </div>

          {submissions.length > 1 && (
            <div className="flex flex-col gap-1">
              <Text variant="caps-14" className="text-muted-foreground">
                ATTEMPT HISTORY
              </Text>
              <div className="flex gap-2 flex-wrap">
                {submissions.map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      'rounded px-2 py-1 text-xs font-medium',
                      s.passed
                        ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400',
                    )}
                  >
                    #{i + 1} {s.passed ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Text variant="main-14" className="text-muted-foreground">
          Submit your code to see results.
        </Text>
      )}

      {attemptsLeft === 0 && (
        <Text variant="main-14" className="text-muted-foreground">
          No attempts remaining.
        </Text>
      )}
    </div>
  )
}
