import { api } from './fetcher'
import { RateLimitError, parseRateLimitReason } from './rate-limit'
import { getRateLimitCopy } from '@/lib/lessons/rate-limit-copy'

export interface SubmitCodingTaskPayload {
  courseSlug: string
  lessonSlug: string
  code: string
  language: 'solidity' | 'rust' | 'typescript'
}

export interface SubmitCodingTaskResponse {
  passed: boolean
}

export const submitCodingTask = async (payload: SubmitCodingTaskPayload): Promise<SubmitCodingTaskResponse> => {
  const response = await api({ credentials: 'include' }).post('/api/lessons/submit-coding-task', payload)
  if (response.status === 429) {
    const reason = parseRateLimitReason(response.errorData?.reason)
    const retryAfterMs = (response.errorData?.retryAfterMs as number | undefined) ?? 10_000
    const resetAt = (response.errorData?.resetAt as string | undefined) ?? null
    throw new RateLimitError({
      reason,
      retryAfterMs,
      resetAt,
      message: getRateLimitCopy(reason, resetAt),
    })
  }
  if (!response.data && response.status >= 400) {
    throw new Error(response.error ?? 'Failed to submit code')
  }
  return response.data as SubmitCodingTaskResponse
}
