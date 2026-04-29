import { LessonNavigation } from '../lesson-navigation/lesson-navigation'
import type { Lesson } from '@/types/lesson'

interface LessonLectureProps {
  lesson: Lesson
  courseSlug: string
}

export const LessonLecture = ({ lesson, courseSlug }: LessonLectureProps) => {
  return <LessonNavigation courseSlug={courseSlug} lesson={lesson} />
}
