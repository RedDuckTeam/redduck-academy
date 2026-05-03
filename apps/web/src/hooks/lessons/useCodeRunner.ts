import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { Lesson } from '@/types/lesson'
import type { RunnerReport } from '@/lib/code-runner'
import { parseLessonTestCases } from '@/lib/lessons/parse-executable-cases'
import { buildRunnerSpec } from '@/lib/lessons/build-runner-spec'

export type LiveStatus = 'pass' | 'fail' | null

export interface UseCodeRunnerResult {
  /** Most recent report, regardless of source (run or submit). */
  report: RunnerReport | null
  /** Tests are executing in the browser. */
  isRunning: boolean
  /** Most recent verdict to surface in the status bar. */
  liveStatus: LiveStatus
  /** Run executable tests against `code` for `lesson`; updates state and returns the report. */
  run: (code: string) => Promise<RunnerReport | null>
  /** Apply the verdict from a Submit call so the status bar reflects the server's decision. */
  applyServerVerdict: (input: { passed: boolean; report: RunnerReport | null }) => void
  /** Clear local report/status, e.g. when the user resets to starter code. */
  reset: () => void
}

const NO_VALID_SPEC =
  'This lesson has executable tests but no valid function signature. Ask an admin to fix the lesson configuration.'

export function useCodeRunner(lesson: Lesson): UseCodeRunnerResult {
  const [report, setReport] = useState<RunnerReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [liveStatus, setLiveStatus] = useState<LiveStatus>(null)

  const run = useCallback(
    async (code: string): Promise<RunnerReport | null> => {
      const cases = parseLessonTestCases(lesson)
      if (cases.length === 0) return null

      const spec = buildRunnerSpec(lesson)
      if (!spec) {
        toast.error(NO_VALID_SPEC)
        return null
      }

      setIsRunning(true)
      try {
        const { runTests } = await import('@/lib/code-runner')
        const result = await runTests(code, spec, cases)
        setReport(result)
        setLiveStatus(result.allPassed ? 'pass' : 'fail')
        if (result.fatalError) toast.error(result.fatalError)
        return result
      } catch (err) {
        setLiveStatus('fail')
        toast.error(err instanceof Error ? err.message : 'Failed to run tests')
        return null
      } finally {
        setIsRunning(false)
      }
    },
    [lesson],
  )

  const applyServerVerdict = useCallback(
    ({ passed, report: serverReport }: { passed: boolean; report: RunnerReport | null }) => {
      if (serverReport) setReport(serverReport)
      setLiveStatus(passed ? 'pass' : 'fail')
    },
    [],
  )

  const reset = useCallback(() => {
    setReport(null)
    setLiveStatus(null)
  }, [])

  return { report, isRunning, liveStatus, run, applyServerVerdict, reset }
}
