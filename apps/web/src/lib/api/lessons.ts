import { api } from './fetcher'

export const markLessonAsCompleted = async (courseSlug: string, lessonSlug: string) => {
  await api({ credentials: 'include' }).post(`/api/lessons/${courseSlug}/${lessonSlug}/mark-completed`)
}
