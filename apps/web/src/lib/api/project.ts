import { api } from './fetcher'
import { RateLimitError } from './coding-task'

export interface SubmitProjectPayload {
  courseSlug: string
  lessonSlug: string
  repoUrl: string
}

export interface SubmitProjectResponse {
  success: true
}

export const submitProject = async (payload: SubmitProjectPayload): Promise<SubmitProjectResponse> => {
  const response = await api({ credentials: 'include' }).post(
    '/api/lessons/submit-project',
    payload,
  )
  if (response.status === 429) {
    const retryAfterMs = (response.errorData?.retryAfterMs as number | undefined) ?? 60_000
    throw new RateLimitError(retryAfterMs)
  }
  if (!response.data && response.status >= 400) {
    throw new Error(response.error ?? 'Failed to submit project')
  }
  return response.data as SubmitProjectResponse
}
