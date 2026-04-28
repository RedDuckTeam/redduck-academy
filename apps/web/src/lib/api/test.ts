import { api } from './fetcher'

export interface SubmitTestPayload {
  courseSlug: string
  lessonSlug: string
  answers: Record<string, string[]> // questionId -> optionIds
}

export const submitTest = async (payload: SubmitTestPayload): Promise<void> => {
  await api({ credentials: 'include' }).post('/api/lessons/submit-test', payload)
}
