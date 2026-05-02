import { api } from './fetcher'
import { ApiError } from './errors'
import { RateLimitError, parseRateLimitReason } from './rate-limit'
import { getRateLimitCopy } from '@/lib/lessons/rate-limit-copy'

export interface SubmitCodingTaskPayload {
  courseSlug: string
  lessonSlug: string
  code: string
  language: 'solidity' | 'rust' | 'typescript'
  /** Result of running the executable tests in the browser; null when the lesson has no tests. */
  clientPassed: boolean | null
}

export interface SubmitCodingTaskResponse {
  passed: boolean
}

export const submitCodingTask = async (payload: SubmitCodingTaskPayload): Promise<SubmitCodingTaskResponse> => {
  try {
    return await api({ credentials: 'include' }).post<SubmitCodingTaskResponse>('/api/lessons/submit-coding-task', payload)
  } catch (err) {
    if (err instanceof ApiError && err.status === 429) {
      const reason = parseRateLimitReason(err.extra?.reason)
      const retryAfterMs = (err.extra?.retryAfterMs as number | undefined) ?? 10_000
      const resetAt = (err.extra?.resetAt as string | undefined) ?? null
      throw new RateLimitError({
        reason,
        retryAfterMs,
        resetAt,
        message: getRateLimitCopy(reason, resetAt),
      })
    }
    throw err
  }
}
