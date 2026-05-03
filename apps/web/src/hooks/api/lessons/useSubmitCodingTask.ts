import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { submitCodingTask, type SubmitCodingTaskPayload, type SubmitCodingTaskResponse } from '@/lib/api/coding-task'
import { queryKeys } from '@/lib/query-keys'
import { RateLimitError } from '@/lib/api/rate-limit'
import type { Lesson, UserSettings } from '@/types/lesson'
import type { RunnerReport } from '@/lib/code-runner'
import { parseLessonTestCases } from '@/lib/lessons/parse-executable-cases'
import { buildRunnerSpec } from '@/lib/lessons/build-runner-spec'

const BAN_ERROR = "Couldn't submit lesson, please contact support"

export type SubmitInput = Omit<SubmitCodingTaskPayload, 'clientPassed'> & {
  lesson: Lesson
}

export interface SubmitCodingTaskResult extends SubmitCodingTaskResponse {
  report: RunnerReport | null
}

export const useSubmitCodingTask = (courseSlug: string, lessonSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation<SubmitCodingTaskResult, Error, SubmitInput>({
    mutationFn: async ({ lesson, ...rest }) => {
      const settings = queryClient.getQueryData<UserSettings>(queryKeys.user.settings())
      if (settings?.blacklisted) throw new Error(BAN_ERROR)

      const cases = parseLessonTestCases(lesson)
      let report: RunnerReport | null = null
      let clientPassed: boolean | null = null

      if (cases.length > 0) {
        const spec = buildRunnerSpec(lesson)
        if (!spec) {
          throw new Error(
            'This lesson has executable tests but no valid function signature. Ask an admin to fix the lesson configuration.',
          )
        }
        const { runTests } = await import('@/lib/code-runner')
        report = await runTests(rest.code, spec, cases)
        clientPassed = report.allPassed
      }

      const apiResult = await submitCodingTask({ ...rest, clientPassed })
      return { ...apiResult, report }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.lesson(courseSlug, lessonSlug) })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.completedLessons() })
    },
    onError: (error) => {
      if (error instanceof RateLimitError) {
        toast.error(error.message)
        return
      }
      toast.error(error instanceof Error ? error.message : 'Failed to submit code')
    },
  })
}
