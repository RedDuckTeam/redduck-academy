import { api } from './fetcher'

export interface SubmitTestPayload {
  courseSlug: string
  lessonSlug: string
  answers: Record<string, string[]> // questionId -> optionIds
}

export const submitTest = async (payload: SubmitTestPayload): Promise<void> => {
  const response = await api({ credentials: 'include' }).post(
    '/api/lessons/submit-test',
    payload,
  )
  if (!response.data && response.status >= 400) {
    throw new Error(response.error ?? 'Failed to submit test')
  }
}
