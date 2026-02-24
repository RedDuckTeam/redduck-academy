import { api } from './fetcher'

export interface SubmitTestPayload {
  answers: Record<string, string[]> // questionId -> optionIds
}

export interface SubmitTestResponse {
  data: {
    score: number
    correctAnswers: Record<string, string[]> // questionId -> optionIds
  }
}

export const submitTest = async (
  courseSlug: string,
  lessonSlug: string,
  payload: SubmitTestPayload,
) => {
  const response = await api().post<SubmitTestResponse['data']>(
    `/api/courses/${courseSlug}/lessons/${lessonSlug}/validate`,
    payload.answers,
  )
  return response.data
}
