import { api } from './fetcher'

export interface SubmitCodingTaskPayload {
  courseSlug: string
  lessonSlug: string
  code: string
  language: 'solidity' | 'rust' | 'typescript'
}

export interface SubmitCodingTaskResponse {
  passed: boolean
  attemptsLeft: number
}

export const submitCodingTask = async (payload: SubmitCodingTaskPayload): Promise<SubmitCodingTaskResponse> => {
  const response = await api({ credentials: 'include' }).post('/api/lessons/submit-coding-task', payload)
  if (!response.data && response.status >= 400) {
    throw new Error(response.error ?? 'Failed to submit code')
  }
  return response.data as SubmitCodingTaskResponse
}
