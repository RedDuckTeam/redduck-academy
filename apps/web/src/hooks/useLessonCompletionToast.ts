import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useCompletedLessons } from '@/hooks/api/user/useCompletedLessons'

interface UseLessonCompletionToastArgs {
  courseSlug: string
  lessonSlug: string
  lessonTitle: string
}

export const useLessonCompletionToast = ({ courseSlug, lessonSlug, lessonTitle }: UseLessonCompletionToastArgs) => {
  const { data: completedLessons } = useCompletedLessons()
  const baselineCompletedRef = useRef<boolean | null>(null)
  const trackedLessonRef = useRef<string | null>(null)

  useEffect(() => {
    const lessonKey = `${courseSlug}/${lessonSlug}`
    if (trackedLessonRef.current !== lessonKey) {
      trackedLessonRef.current = lessonKey
      baselineCompletedRef.current = null
    }

    if (!completedLessons) return

    const isCompletedNow = completedLessons.some(
      (l) => l.courseSlug === courseSlug && l.lessonSlug === lessonSlug,
    )

    if (baselineCompletedRef.current === null) {
      baselineCompletedRef.current = isCompletedNow
      return
    }

    if (!baselineCompletedRef.current && isCompletedNow) {
      toast.success('Lesson completed', { description: `Lesson ${lessonTitle} completed` })
      baselineCompletedRef.current = true
    }
  }, [completedLessons, courseSlug, lessonSlug, lessonTitle])
}
