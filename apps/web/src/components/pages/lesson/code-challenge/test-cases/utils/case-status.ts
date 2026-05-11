import type { RunnerResult } from '@/lib/code-runner'

export type CaseStatus = 'pass' | 'fail' | 'pending' | 'idle'

export function resolveCaseStatus(result: RunnerResult | undefined, isRunning: boolean): CaseStatus {
  if (isRunning) return 'pending'
  if (!result) return 'idle'
  return result.passed ? 'pass' : 'fail'
}
