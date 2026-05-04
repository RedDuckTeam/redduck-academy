import { api } from './fetcher'
import { ApiError } from './errors'
import { RateLimitError } from './rate-limit'

export interface SubmitProjectPayload {
  courseSlug: string
  lessonSlug: string
  repoUrl: string
}

export interface SubmitProjectResponse {
  success: true
}

export const submitProject = async (payload: SubmitProjectPayload): Promise<SubmitProjectResponse> => {
  try {
    return await api().post<SubmitProjectResponse>('/api/lessons/submit-project', payload)
  } catch (err) {
    if (err instanceof ApiError && err.status === 429) {
      const retryAfterMs = (err.extra?.retryAfterMs as number | undefined) ?? 60_000
      throw new RateLimitError({ reason: null, retryAfterMs })
    }
    throw err
  }
}
