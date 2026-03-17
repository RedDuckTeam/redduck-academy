import { api } from './fetcher'

export const markLessonAsCompleted = async (courseSlug: string, lessonSlug: string) => {
  const response = await api({ credentials: 'include' }).post(
    `/api/lessons/${courseSlug}/${lessonSlug}/mark-completed`,
  )
  return response
}
