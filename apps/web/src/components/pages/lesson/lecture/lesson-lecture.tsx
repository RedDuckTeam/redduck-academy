import { NextButton } from './next-button'
import type { Lesson } from '@/types/lesson'

interface LessonLectureProps {
  lesson: Lesson
  courseSlug: string
  moduleSlug: string
}

export const LessonLecture = ({ lesson, courseSlug, moduleSlug }: LessonLectureProps) => {
  return <NextButton courseSlug={courseSlug} moduleSlug={moduleSlug} lesson={lesson} className="max-sm:w-full" />
}
