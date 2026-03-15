import { NextButton } from './next-button'
import type { Lesson } from '@/types/lesson'
import { RichText } from '@/components/ui/rich-text'

interface LessonLectureProps {
  lesson: Lesson
}

export const LessonLecture = ({ lesson }: LessonLectureProps) => {
  return <NextButton />
}
