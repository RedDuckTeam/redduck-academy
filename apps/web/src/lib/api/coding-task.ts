import { api } from './fetcher'

export interface SubmitCodingTaskPayload {
  courseSlug: string
  lessonSlug: string
  code: string
  language: 'solidity' | 'rust' | 'typescript'
}

export interface SubmitCodingTaskResponse {
  passed: boolean
  attemptsRemaining: number
}

export class RateLimitError extends Error {
  retryAfterMs: number
  constructor(retryAfterMs: number) {
    super('Too many submissions. Please wait before trying again.')
    this.name = 'RateLimitError'
    this.retryAfterMs = retryAfterMs
  }
}

export const submitCodingTask = async (payload: SubmitCodingTaskPayload): Promise<SubmitCodingTaskResponse> => {
  const response = await api({ credentials: 'include' }).post('/api/lessons/submit-coding-task', payload)
  if (response.status === 429) {
    const retryAfterMs = (response.errorData?.retryAfterMs as number | undefined) ?? 60_000
    throw new RateLimitError(retryAfterMs)
  }
  if (!response.data && response.status >= 400) {
    throw new Error(response.error ?? 'Failed to submit code')
  }
  return response.data as SubmitCodingTaskResponse
}
