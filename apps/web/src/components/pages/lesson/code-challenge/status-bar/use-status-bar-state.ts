import type { CodingTaskSubmission } from '@/types/lesson'
import type { LiveStatus } from '@/hooks/lessons/useCodeRunner'
import type { RateLimitError } from '@/lib/api/rate-limit'
import { getRateLimitCopy } from '@/lib/lessons/rate-limit-copy'

export type StatusBarState =
  | { kind: 'none' }
  | { kind: 'rate-limit'; message: string }
  | { kind: 'live'; passed: boolean }
  | { kind: 'latest'; passed: boolean }

interface Args {
  rateLimitError: RateLimitError | null
  liveStatus: LiveStatus
  latest: CodingTaskSubmission | undefined
  isPending: boolean
  isRunning: boolean
}

/**
 * Decides which row to show in the absolute status bar.
 * Priority: rate-limit > live verdict (run/submit) > persisted latest > nothing.
 * In-flight runs/submits suppress all of them so the user sees a clean state.
 */
export function useStatusBarState({
  rateLimitError,
  liveStatus,
  latest,
  isPending,
  isRunning,
}: Args): StatusBarState {
  if (rateLimitError && !isPending) {
    return { kind: 'rate-limit', message: getRateLimitCopy(rateLimitError.reason, rateLimitError.resetAt) }
  }
  if (isPending || isRunning) return { kind: 'none' }
  if (liveStatus !== null) return { kind: 'live', passed: liveStatus === 'pass' }
  if (latest) return { kind: 'latest', passed: latest.passed }
  return { kind: 'none' }
}
